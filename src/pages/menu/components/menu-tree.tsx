import { useMemo, useRef, useState } from 'react';
import { AdminMenuItem } from '../types';
import {
  Card,
  CardHeader,
  CardHeading,
  CardContent,
  CardToolbar,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronsDownUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  flattenTree,
  findItemInTree,
  getDescendantIds,
  getProjection,
  calculateReorderPayload,
  arrayMove,
} from '../tree-utils';
import {
  SortableMenuTreeNode,
  MenuTreeNodeView,
} from './menu-tree-node';

interface Props {
  items: AdminMenuItem[];
  selectedItem: AdminMenuItem | null;
  onSelect: (item: AdminMenuItem) => void;
  onOpenCreate: (targetParentId?: number | null) => void;
  onReorder: (
    items: { id: number; parentId: number | null; sortOrder: number }[],
  ) => Promise<void>;
  isReordering: boolean;
}

const INDENTATION_WIDTH = 24;

export function MenuTree({
  items,
  selectedItem,
  onSelect,
  onOpenCreate,
  onReorder,
  isReordering,
}: Props) {
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [offsetLeft, setOffsetLeft] = useState<number>(0);
  const offsetLeftRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  // Flattened tree respecting collapsed nodes
  const flattenedItems = useMemo(
    () => flattenTree(items, 1, collapsedIds),
    [items, collapsedIds],
  );

  // When dragging an item, hide its descendants from sortable list to prevent cycles
  const descendantIds = useMemo(() => {
    if (!activeId) return [];
    const activeItem = findItemInTree(items, activeId);
    return activeItem ? getDescendantIds(activeItem) : [];
  }, [activeId, items]);

  const sortableItems = useMemo(() => {
    if (!activeId) return flattenedItems;
    return flattenedItems.filter((i) => !descendantIds.includes(i.id));
  }, [flattenedItems, descendantIds, activeId]);

  // Projected position while dragging (for live preview)
  const projected = useMemo(() => {
    if (!activeId || !overId) return null;
    return getProjection(
      sortableItems,
      activeId,
      overId,
      offsetLeft,
      INDENTATION_WIDTH,
    );
  }, [sortableItems, activeId, overId, offsetLeft]);

  const activeFlatItem = useMemo(() => {
    if (!activeId) return null;
    return flattenedItems.find((i) => i.id === activeId) || null;
  }, [activeId, flattenedItems]);

  const handleToggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (collapsedIds.size > 0) {
      setCollapsedIds(new Set());
    } else {
      // Collect all item IDs that have children
      const allParentIds = new Set<number>();
      const collect = (list: AdminMenuItem[]) => {
        for (const it of list) {
          if (it.children && it.children.length > 0) {
            allParentIds.add(it.id);
            collect(it.children);
          }
        }
      };
      collect(items);
      setCollapsedIds(allParentIds);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = Number(event.active.id);
    setActiveId(id);
    setOverId(id);
    setOffsetLeft(0);
    offsetLeftRef.current = 0;
  };

  const handleDragMove = (event: DragMoveEvent) => {
    setOffsetLeft(event.delta.x);
    offsetLeftRef.current = event.delta.x;
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? Number(event.over.id) : null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
    offsetLeftRef.current = 0;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragOffset = offsetLeftRef.current;

    setActiveId(null);
    setOverId(null);
    setOffsetLeft(0);
    offsetLeftRef.current = 0;

    if (!over) return;

    const activeIdNum = Number(active.id);
    const overIdNum = Number(over.id);
    const activeItem = findItemInTree(items, activeIdNum);
    if (!activeItem) return;

    // Calculate projection synchronously at the exact drop moment
    const currentProjected = getProjection(
      sortableItems,
      activeIdNum,
      overIdNum,
      dragOffset,
      INDENTATION_WIDTH,
    );
    if (!currentProjected) return;

    const activeIndex = sortableItems.findIndex((i) => i.id === activeIdNum);
    const overIndex = sortableItems.findIndex((i) => i.id === overIdNum);
    if (activeIndex === -1 || overIndex === -1) return;

    const didPositionChange = activeIndex !== overIndex;
    const didParentChange = currentProjected.parentId !== activeItem.parentId;

    if (!didPositionChange && !didParentChange) return;

    // Apply the projected reorder locally
    const reordered = arrayMove(sortableItems, activeIndex, overIndex);
    reordered[overIndex] = {
      ...reordered[overIndex],
      depth: currentProjected.depth,
      parentId: currentProjected.parentId,
    };

    // Calculate all affected siblings for PATCH /menu/admin/order
    const payload = calculateReorderPayload(
      reordered,
      activeIdNum,
      currentProjected.parentId,
      items,
    );

    if (payload.length > 0) {
      await onReorder(payload);
    }
  };

  return (
    <Card className="border border-border h-full flex flex-col">
      <CardHeader className="py-3.5 px-4 border-b border-border flex items-center justify-between shrink-0">
        <CardHeading>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Menu Structure</h2>
              <span className="text-xs text-muted-foreground font-normal">
                ({flattenedItems.length} items)
              </span>
              {isReordering && (
                <Loader2 className="size-3.5 animate-spin text-primary ml-1" />
              )}
            </div>
            <span className="text-[11px] text-muted-foreground font-normal">
              Drag handles to reorder & indent (up to 3 levels)
            </span>
          </div>
        </CardHeading>
        <CardToolbar className="flex gap-1.5">
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleToggleAll}
              title={
                collapsedIds.size > 0 ? 'Expand all menus' : 'Collapse all menus'
              }
            >
              {collapsedIds.size > 0 ? (
                <>
                  <ChevronsUpDown className="size-3.5" /> Expand
                </>
              ) : (
                <>
                  <ChevronsDownUp className="size-3.5" /> Collapse
                </>
              )}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            onClick={() => onOpenCreate(null)}
            disabled={isReordering}
            title="Add new root menu item"
          >
            <Plus className="size-3.5" /> Add
          </Button>
        </CardToolbar>
      </CardHeader>

      <CardContent className="p-3 grow overflow-hidden flex flex-col">
        <ScrollArea className="h-full pr-2">
          {items.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm flex flex-col items-center justify-center h-full gap-2">
              <p>No menu items yet.</p>
              <p className="text-xs">Click the "Add" button to create one.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={sortableItems.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
                disabled={isReordering}
              >
                <div
                  className={`flex flex-col gap-1 py-1 transition-opacity ${
                    isReordering ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  {sortableItems.map((item) => (
                    <SortableMenuTreeNode
                      key={item.id}
                      flatItem={item}
                      depth={
                        item.id === activeId && projected
                          ? projected.depth
                          : item.depth
                      }
                      indentationWidth={INDENTATION_WIDTH}
                      isSelected={selectedItem?.id === item.id}
                      onSelect={onSelect}
                      isCollapsed={collapsedIds.has(item.id)}
                      onToggleCollapse={() => handleToggleCollapse(item.id)}
                      isDragging={item.id === activeId}
                      disabled={isReordering}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.4',
                      },
                    },
                  }),
                }}
              >
                {activeFlatItem ? (
                  <div className="w-full">
                    <MenuTreeNodeView
                      item={activeFlatItem.item}
                      depth={projected ? projected.depth : activeFlatItem.depth}
                      indentationWidth={INDENTATION_WIDTH}
                      hasChildren={activeFlatItem.hasChildren}
                      isCollapsed={collapsedIds.has(activeFlatItem.id)}
                      isSelected={false}
                      isOverlay={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
