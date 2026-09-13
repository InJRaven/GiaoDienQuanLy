import React from 'react';
import { FlattenedItem } from '../tree-utils';
import { AdminMenuItem } from '../types';
import {
  ChevronRight,
  ChevronDown,
  Circle,
  GripVertical,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { UniversalIcon } from '@/layouts/demo1/components/universal-icon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NodeViewProps {
  item: AdminMenuItem;
  depth: number;
  indentationWidth?: number;
  hasChildren: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (e: React.MouseEvent) => void;
  isSelected?: boolean;
  onSelect?: (item: AdminMenuItem) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  isOverlay?: boolean;
}

export function MenuTreeNodeView({
  item,
  depth,
  indentationWidth = 24,
  hasChildren,
  isCollapsed = false,
  onToggleCollapse,
  isSelected = false,
  onSelect,
  dragHandleProps,
  isDragging = false,
  isOverlay = false,
}: NodeViewProps) {
  const paddingLeft = (depth - 1) * indentationWidth + 8;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 py-1.5 px-2 rounded-lg border text-sm transition-all select-none',
        isSelected
          ? 'bg-primary/10 border-primary/40 text-foreground font-medium shadow-2xs'
          : 'border-transparent hover:bg-muted/60 text-foreground',
        !item.isActive && 'opacity-60',
        isDragging && 'opacity-30 border-dashed border-primary/60 bg-muted/30',
        isOverlay &&
          'bg-card border-primary shadow-lg ring-2 ring-primary/20 cursor-grabbing',
      )}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={() => onSelect?.(item)}
    >
      {/* Visual indentation guide lines for nested items */}
      {depth > 1 && (
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-px bg-border group-hover:bg-muted-foreground/30 pointer-events-none"
          style={{ left: `${(depth - 1) * indentationWidth - 4}px` }}
        />
      )}

      {/* Drag Handle - Always visible and active */}
      <div
        {...dragHandleProps}
        className="size-6 flex items-center justify-center -ml-1 text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 rounded hover:bg-muted transition-colors touch-none"
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder or change level"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Expand/Collapse Chevron or Dot */}
      <button
        type="button"
        className={cn(
          'size-5 flex items-center justify-center shrink-0 rounded transition-colors',
          hasChildren
            ? 'text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer'
            : 'text-muted-foreground/30 cursor-default',
        )}
        onClick={(e) => {
          if (hasChildren && onToggleCollapse) {
            e.stopPropagation();
            onToggleCollapse(e);
          }
        }}
      >
        {hasChildren ? (
          isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )
        ) : (
          <Circle className="size-1.5 fill-muted-foreground/40 text-muted-foreground/40" />
        )}
      </button>

      {/* Item Icon / Separator Line */}
      {item.type === 'item' && (
        <div className="size-5 flex items-center justify-center shrink-0 text-muted-foreground">
          {item.icon ? (
            <UniversalIcon icon={item.icon} className="size-4" />
          ) : (
            <Circle className="size-2 text-muted-foreground/50" />
          )}
        </div>
      )}

      {item.type === 'separator' && (
        <div className="w-5 border-b-2 border-dashed border-muted-foreground/40 shrink-0" />
      )}

      {/* Title & Path */}
      <div className="flex items-center gap-2 grow min-w-0">
        <span
          className={cn(
            'truncate',
            item.type === 'heading' &&
              'uppercase text-[11px] font-semibold text-muted-foreground tracking-wider',
            item.type === 'separator' &&
              'italic text-xs text-muted-foreground/80 font-mono',
            !item.isActive && 'line-through text-muted-foreground',
          )}
        >
          {item.type === 'separator'
            ? '--- Separator ---'
            : item.title || item.key}
        </span>

        {item.type === 'item' && item.path && (
          <span className="text-[11px] text-muted-foreground/70 font-mono truncate hidden sm:inline max-w-[140px]">
            {item.path}
          </span>
        )}
      </div>

      {/* Badges / Chips */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {item.type === 'item' && item.isCollapse && (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1 font-normal text-muted-foreground gap-1"
          >
            <Layers className="size-2.5" />
            Group
          </Badge>
        )}

        {item.type === 'item' && item.isExternal && (
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1 font-normal text-muted-foreground gap-1"
          >
            <ExternalLink className="size-2.5" />
            Ext
          </Badge>
        )}

        {(item.permission || (item as any).permission_code) && (
          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1 font-mono font-normal text-muted-foreground hidden md:inline-flex"
            title={`Required permission: ${item.permission || (item as any).permission_code}`}
          >
            {item.permission || (item as any).permission_code}
          </Badge>
        )}

        {!item.isActive && (
          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1 text-muted-foreground bg-muted font-normal"
            title="Hidden from sidebar menu"
          >
            Hidden
          </Badge>
        )}
      </div>
    </div>
  );
}

interface SortableNodeProps {
  flatItem: FlattenedItem;
  depth: number;
  indentationWidth?: number;
  isSelected: boolean;
  onSelect: (item: AdminMenuItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDragging?: boolean;
  disabled?: boolean;
}

export function SortableMenuTreeNode({
  flatItem,
  depth,
  indentationWidth = 24,
  isSelected,
  onSelect,
  isCollapsed,
  onToggleCollapse,
  isDragging,
  disabled = false,
}: SortableNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isNodeDragging,
  } = useSortable({
    id: flatItem.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MenuTreeNodeView
        item={flatItem.item}
        depth={depth}
        indentationWidth={indentationWidth}
        hasChildren={flatItem.hasChildren}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        isSelected={isSelected}
        onSelect={onSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging || isNodeDragging}
      />
    </div>
  );
}
