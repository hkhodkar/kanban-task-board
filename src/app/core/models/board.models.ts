export const LABEL_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Member {
  id: string;
  name: string;
  /** background color of the avatar */
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  labelIds: string[];
  assigneeId: string | null;
  /** ISO date (yyyy-mm-dd) or null */
  dueDate: string | null;
  checklist: ChecklistItem[];
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  version: 1;
  boards: Board[];
  members: Member[];
}

export type CardChanges = Partial<Omit<Card, 'id' | 'createdAt'>>;

export type DueFilter = 'all' | 'overdue' | 'week' | 'none';

export interface CardFilters {
  search: string;
  labelId: string | null;
  /** member id, 'unassigned' or null for anyone */
  assigneeId: string | null;
  due: DueFilter;
}

export const EMPTY_FILTERS: CardFilters = {
  search: '',
  labelId: null,
  assigneeId: null,
  due: 'all',
};

export type DueStatus = 'overdue' | 'today' | 'soon' | 'later';
