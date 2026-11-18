import { Card, CardFilters, Column, DueStatus } from '../models/board.models';
import { daysBetween, todayIso } from './date.utils';

/** Cards due within this many days count as "due soon". */
export const DUE_SOON_DAYS = 2;

export function dueStatus(card: Pick<Card, 'dueDate'>, today = todayIso()): DueStatus | null {
  if (!card.dueDate) {
    return null;
  }
  const days = daysBetween(today, card.dueDate);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= DUE_SOON_DAYS) return 'soon';
  return 'later';
}

const DONE_TITLES = /^(done|complete|completed|finished|shipped|published|closed)$/i;

/** Cards in a "done" column are never shown as overdue and count towards progress. */
export function isDoneColumn(column: Pick<Column, 'title'>): boolean {
  return DONE_TITLES.test(column.title.trim());
}

export function checklistProgress(card: Pick<Card, 'checklist'>): { done: number; total: number } {
  return {
    done: card.checklist.filter((item) => item.done).length,
    total: card.checklist.length,
  };
}

export function hasActiveFilters(filters: CardFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.labelId !== null ||
    filters.assigneeId !== null ||
    filters.due !== 'all'
  );
}

/** `done` marks cards in a done column, they never count as overdue. */
export function matchesFilters(
  card: Card,
  filters: CardFilters,
  today = todayIso(),
  done = false,
): boolean {
  const query = filters.search.trim().toLowerCase();
  if (
    query &&
    !card.title.toLowerCase().includes(query) &&
    !card.description.toLowerCase().includes(query)
  ) {
    return false;
  }

  if (filters.labelId && !card.labelIds.includes(filters.labelId)) {
    return false;
  }

  if (filters.assigneeId === 'unassigned') {
    if (card.assigneeId) return false;
  } else if (filters.assigneeId && card.assigneeId !== filters.assigneeId) {
    return false;
  }

  switch (filters.due) {
    case 'overdue':
      return !done && dueStatus(card, today) === 'overdue';
    case 'week': {
      // today plus the next six days
      if (!card.dueDate) return false;
      const days = daysBetween(today, card.dueDate);
      return days >= 0 && days < 7;
    }
    case 'none':
      return !card.dueDate;
    default:
      return true;
  }
}

/**
 * Converts a drop position in a filtered list into an index in the full list.
 * Both lists must already exclude the card being moved.
 */
export function toFullIndex(fullList: Card[], visibleList: Card[], visibleIndex: number): number {
  if (visibleIndex > 0 && visibleList.length > 0) {
    const before = visibleList[Math.min(visibleIndex, visibleList.length) - 1];
    return fullList.findIndex((card) => card.id === before.id) + 1;
  }
  if (visibleList.length > 0) {
    return fullList.findIndex((card) => card.id === visibleList[0].id);
  }
  // nothing visible in the target column: append to the end
  return fullList.length;
}
