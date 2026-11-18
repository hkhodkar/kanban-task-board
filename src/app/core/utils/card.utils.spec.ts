import { Card, EMPTY_FILTERS } from '../models/board.models';
import {
  dueStatus,
  hasActiveFilters,
  isDoneColumn,
  matchesFilters,
  toFullIndex,
} from './card.utils';

const TODAY = '2026-03-10';

function card(id: string, overrides: Partial<Card> = {}): Card {
  return {
    id,
    title: `Card ${id}`,
    description: '',
    labelIds: [],
    assigneeId: null,
    dueDate: null,
    checklist: [],
    createdAt: '2026-03-01',
    ...overrides,
  };
}

describe('dueStatus', () => {
  it('classifies due dates relative to today', () => {
    expect(dueStatus(card('a'), TODAY)).toBeNull();
    expect(dueStatus(card('a', { dueDate: '2026-03-09' }), TODAY)).toBe('overdue');
    expect(dueStatus(card('a', { dueDate: '2026-03-10' }), TODAY)).toBe('today');
    expect(dueStatus(card('a', { dueDate: '2026-03-12' }), TODAY)).toBe('soon');
    expect(dueStatus(card('a', { dueDate: '2026-03-13' }), TODAY)).toBe('later');
  });
});

describe('matchesFilters', () => {
  const cards = [
    card('1', {
      title: 'Fix login bug',
      labelIds: ['bug'],
      assigneeId: 'm-1',
      dueDate: '2026-03-08',
    }),
    card('2', { title: 'Landing page', description: 'Hero and pricing', dueDate: '2026-03-14' }),
    card('3', { title: 'Docs', labelIds: ['docs'], assigneeId: 'm-2', dueDate: '2026-03-30' }),
  ];

  const ids = (filters: Partial<typeof EMPTY_FILTERS>) =>
    cards
      .filter((c) => matchesFilters(c, { ...EMPTY_FILTERS, ...filters }, TODAY))
      .map((c) => c.id);

  it('matches everything without filters', () => {
    expect(ids({})).toEqual(['1', '2', '3']);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('searches title and description, case insensitive', () => {
    expect(ids({ search: 'LOGIN' })).toEqual(['1']);
    expect(ids({ search: 'pricing' })).toEqual(['2']);
  });

  it('filters by label and assignee', () => {
    expect(ids({ labelId: 'docs' })).toEqual(['3']);
    expect(ids({ assigneeId: 'm-1' })).toEqual(['1']);
    expect(ids({ assigneeId: 'unassigned' })).toEqual(['2']);
  });

  it('filters by due date', () => {
    expect(ids({ due: 'overdue' })).toEqual(['1']);
    expect(ids({ due: 'week' })).toEqual(['2']);
    expect(ids({ due: 'none' })).toEqual([]);
  });

  it('never treats cards in a done column as overdue', () => {
    const filters = { ...EMPTY_FILTERS, due: 'overdue' as const };
    expect(matchesFilters(cards[0], filters, TODAY, true)).toBe(false);
  });

  it('combines filters', () => {
    expect(ids({ search: 'docs', assigneeId: 'm-1' })).toEqual([]);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, due: 'overdue' })).toBe(true);
  });
});

describe('toFullIndex', () => {
  const full = ['a', 'b', 'c', 'd', 'e'].map((id) => card(id));

  it('returns the same index when nothing is filtered', () => {
    expect(toFullIndex(full, full, 0)).toBe(0);
    expect(toFullIndex(full, full, 3)).toBe(3);
    expect(toFullIndex(full, full, 5)).toBe(5);
  });

  it('maps a position in the filtered list to the full list', () => {
    const visible = [full[1], full[3]]; // b, d
    expect(toFullIndex(full, visible, 0)).toBe(1); // before b
    expect(toFullIndex(full, visible, 1)).toBe(2); // after b
    expect(toFullIndex(full, visible, 2)).toBe(4); // after d
  });

  it('appends when no card of the column is visible', () => {
    expect(toFullIndex(full, [], 0)).toBe(5);
    expect(toFullIndex([], [], 0)).toBe(0);
  });
});

describe('isDoneColumn', () => {
  it('recognises common "done" column names', () => {
    expect(isDoneColumn({ title: 'Done' })).toBe(true);
    expect(isDoneColumn({ title: ' published ' })).toBe(true);
    expect(isDoneColumn({ title: 'In progress' })).toBe(false);
  });
});
