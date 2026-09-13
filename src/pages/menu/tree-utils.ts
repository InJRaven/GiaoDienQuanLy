import { AdminMenuItem } from './types';

export interface FlattenedItem {
  id: number;
  parentId: number | null;
  depth: number; // 1, 2, or 3
  index: number;
  item: AdminMenuItem;
  hasChildren: boolean;
  childCount: number;
}

/**
 * Flattens a recursive menu tree into a list of FlattenedItem with depth annotations.
 */
export function flattenTree(
  items: AdminMenuItem[],
  depth: number = 1,
  collapsedIds: Set<number> = new Set(),
): FlattenedItem[] {
  const result: FlattenedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const children = item.children || [];
    result.push({
      id: item.id,
      parentId: item.parentId,
      depth,
      index: i,
      item,
      hasChildren: children.length > 0,
      childCount: children.length,
    });

    if (children.length > 0 && !collapsedIds.has(item.id)) {
      result.push(...flattenTree(children, depth + 1, collapsedIds));
    }
  }

  return result;
}

/**
 * Finds a menu item by ID within a recursive tree.
 */
export function findItemInTree(
  items: AdminMenuItem[],
  id: number,
): AdminMenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children && item.children.length > 0) {
      const found = findItemInTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Gets all descendant IDs of a node (children, grandchildren, etc.).
 */
export function getDescendantIds(item: AdminMenuItem): number[] {
  const ids: number[] = [];
  if (!item.children || item.children.length === 0) return ids;

  for (const child of item.children) {
    ids.push(child.id);
    ids.push(...getDescendantIds(child));
  }
  return ids;
}

/**
 * Calculates the maximum depth of a branch (subtree height).
 * A leaf node has height 1. Node with child has 2. Node with grandchild has 3.
 */
export function getSubtreeHeight(item: AdminMenuItem): number {
  if (!item.children || item.children.length === 0) return 1;
  const childHeights = item.children.map((c) => getSubtreeHeight(c));
  return 1 + Math.max(...childHeights);
}

/**
 * Checks if moving an item to targetParentId would cause a cycle.
 */
export function wouldCauseCycle(
  item: AdminMenuItem,
  targetParentId: number | null,
): boolean {
  if (targetParentId === null) return false;
  if (targetParentId === item.id) return true;
  const descendantIds = getDescendantIds(item);
  return descendantIds.includes(targetParentId);
}

/**
 * Move an array element from one index to another.
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0],
  );
  return newArray;
}

export interface ProjectedPosition {
  depth: number;
  maxDepth: number;
  minDepth: number;
  parentId: number | null;
}

/**
 * Calculates the projected depth and new parentId for an active item being dragged over overId.
 * Adheres strictly to:
 * 1. Maximum 3 levels total (depth 1, 2, or 3).
 * 2. Tree height constraint: an item with subtreeHeight cannot exceed (4 - subtreeHeight).
 * 3. Separator items cannot accept children.
 * 4. First item in tree must be root (depth 1).
 */
export function getProjection(
  items: FlattenedItem[],
  activeId: number,
  overId: number,
  dragOffset: number,
  indentationWidth: number = 24,
): ProjectedPosition | null {
  const activeIndex = items.findIndex((i) => i.id === activeId);
  const overIndex = items.findIndex((i) => i.id === overId);

  if (activeIndex === -1 || overIndex === -1) return null;

  const activeItem = items[activeIndex];
  const newItems = arrayMove(items, activeIndex, overIndex);
  const previousItem = newItems[overIndex - 1];
  const nextItem = newItems[overIndex + 1];

  const subtreeHeight = getSubtreeHeight(activeItem.item);
  // Maximum depth active item can occupy so its descendants do not exceed level 3
  const maxAllowedDepth = Math.max(1, 4 - subtreeHeight);

  const depthOffset = Math.round(dragOffset / indentationWidth);
  const targetDepth = activeItem.depth + depthOffset;

  let minDepth = 1;
  let maxDepth = 1;

  if (overIndex > 0 && previousItem) {
    const canBeChildOfPrev = previousItem.item.type !== 'separator';
    const maxPossibleDepth = canBeChildOfPrev
      ? previousItem.depth + 1
      : previousItem.depth;
    maxDepth = Math.min(maxPossibleDepth, maxAllowedDepth);
    minDepth = nextItem ? Math.min(nextItem.depth, maxDepth) : 1;
    if (minDepth > maxDepth) minDepth = maxDepth;
  }

  let projectedDepth = targetDepth;
  if (projectedDepth > maxDepth) projectedDepth = maxDepth;
  if (projectedDepth < minDepth) projectedDepth = minDepth;

  let parentId: number | null = null;
  if (projectedDepth === 1) {
    parentId = null;
  } else if (previousItem && projectedDepth === previousItem.depth + 1) {
    parentId = previousItem.id;
  } else if (previousItem && projectedDepth === previousItem.depth) {
    parentId = previousItem.parentId;
  } else if (previousItem) {
    for (let i = overIndex - 1; i >= 0; i--) {
      if (newItems[i].depth === projectedDepth) {
        parentId = newItems[i].parentId;
        break;
      }
    }
  }

  return {
    depth: projectedDepth,
    maxDepth,
    minDepth,
    parentId,
  };
}

/**
 * Computes affected siblings for PATCH /menu/admin/order.
 * Spaced by 10 (10, 20, 30...).
 * Sends all affected siblings in both the previous parent and new parent branches.
 */
export function calculateReorderPayload(
  flatItems: FlattenedItem[],
  activeId: number,
  newParentId: number | null,
  originalTree: AdminMenuItem[],
): { id: number; parentId: number | null; sortOrder: number }[] {
  const originalItem = findItemInTree(originalTree, activeId);
  const oldParentId = originalItem ? originalItem.parentId : null;

  // Siblings in destination parent in their new order
  const newSiblings = flatItems.filter((f) => f.parentId === newParentId);
  const newSiblingPayload = newSiblings.map((s, idx) => ({
    id: s.id,
    parentId: newParentId,
    sortOrder: (idx + 1) * 10,
  }));

  // If parent didn't change, only destination siblings were reordered
  if (oldParentId === newParentId) {
    return newSiblingPayload;
  }

  // If parent changed, also renumber remaining siblings in the source parent
  const oldSiblings = flatItems.filter((f) => f.parentId === oldParentId);
  const oldSiblingPayload = oldSiblings.map((s, idx) => ({
    id: s.id,
    parentId: oldParentId,
    sortOrder: (idx + 1) * 10,
  }));

  // Both sets are disjoint because oldParentId !== newParentId
  return [...oldSiblingPayload, ...newSiblingPayload];
}

