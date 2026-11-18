import { Injectable, computed, inject, signal } from '@angular/core';
import { BoardTemplate, createBoardFromTemplate, createDemoState } from '../data/seed-data';
import { Board, BoardState, Card, CardChanges, Column } from '../models/board.models';
import { todayIso } from '../utils/date.utils';
import { createId } from '../utils/id';
import { StorageService } from './storage.service';

export const STORAGE_KEY = 'kanban-board.state';

export interface CardLocation {
  card: Card;
  column: Column;
  index: number;
}

/** What is needed to put a deleted card back where it was. */
export interface RemovedCard {
  boardId: string;
  columnId: string;
  index: number;
  card: Card;
}

/**
 * Single source of truth for boards, columns and cards.
 * State lives in a signal, every change is an immutable update and is saved to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly storage = inject(StorageService);
  private readonly state = signal<BoardState>(this.load());

  readonly boards = computed(() => this.state().boards);
  readonly members = computed(() => this.state().members);

  getBoard(boardId: string): Board | undefined {
    return this.boards().find((board) => board.id === boardId);
  }

  findCard(boardId: string, cardId: string): CardLocation | null {
    for (const column of this.getBoard(boardId)?.columns ?? []) {
      const index = column.cards.findIndex((card) => card.id === cardId);
      if (index !== -1) {
        return { card: column.cards[index], column, index };
      }
    }
    return null;
  }

  // Boards

  createBoard(name: string, template: BoardTemplate = 'basic'): Board {
    const board = createBoardFromTemplate(name.trim(), template);
    this.setState((state) => ({ ...state, boards: [...state.boards, board] }));
    return board;
  }

  updateBoard(boardId: string, changes: Partial<Pick<Board, 'name' | 'description'>>): void {
    this.patchBoard(boardId, (board) => ({ ...board, ...changes }));
  }

  deleteBoard(boardId: string): void {
    this.setState((state) => ({
      ...state,
      boards: state.boards.filter((board) => board.id !== boardId),
    }));
  }

  // Columns

  addColumn(boardId: string, title: string): Column {
    const column: Column = { id: createId('col'), title: title.trim(), cards: [] };
    this.patchBoard(boardId, (board) => ({ ...board, columns: [...board.columns, column] }));
    return column;
  }

  renameColumn(boardId: string, columnId: string, title: string): void {
    this.patchColumns(boardId, (columns) =>
      columns.map((column) =>
        column.id === columnId ? { ...column, title: title.trim() } : column,
      ),
    );
  }

  deleteColumn(boardId: string, columnId: string): void {
    this.patchColumns(boardId, (columns) => columns.filter((column) => column.id !== columnId));
  }

  moveColumn(boardId: string, fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    this.patchColumns(boardId, (columns) => moveItem(columns, fromIndex, toIndex));
  }

  // Cards

  addCard(boardId: string, columnId: string, title: string): Card {
    const card: Card = {
      id: createId('card'),
      title: title.trim(),
      description: '',
      labelIds: [],
      assigneeId: null,
      dueDate: null,
      checklist: [],
      createdAt: todayIso(),
    };
    this.patchColumns(boardId, (columns) =>
      columns.map((column) =>
        column.id === columnId ? { ...column, cards: [...column.cards, card] } : column,
      ),
    );
    return card;
  }

  updateCard(boardId: string, cardId: string, changes: CardChanges): void {
    this.patchColumns(boardId, (columns) =>
      columns.map((column) =>
        column.cards.some((card) => card.id === cardId)
          ? {
              ...column,
              cards: column.cards.map((card) =>
                card.id === cardId ? { ...card, ...changes } : card,
              ),
            }
          : column,
      ),
    );
  }

  /** Moves a card to `toIndex` of the target column (index counted without the moved card). */
  moveCard(boardId: string, cardId: string, toColumnId: string, toIndex: number): void {
    const location = this.findCard(boardId, cardId);
    if (!location) return;
    if (location.column.id === toColumnId && location.index === toIndex) return;

    this.patchColumns(boardId, (columns) => {
      const withoutCard = columns.map((column) =>
        column.id === location.column.id
          ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
          : column,
      );
      return withoutCard.map((column) => {
        if (column.id !== toColumnId) return column;
        const cards = [...column.cards];
        cards.splice(clamp(toIndex, 0, cards.length), 0, location.card);
        return { ...column, cards };
      });
    });
  }

  deleteCard(boardId: string, cardId: string): RemovedCard | null {
    const location = this.findCard(boardId, cardId);
    if (!location) return null;
    this.patchColumns(boardId, (columns) =>
      columns.map((column) =>
        column.id === location.column.id
          ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
          : column,
      ),
    );
    return { boardId, columnId: location.column.id, index: location.index, card: location.card };
  }

  restoreCard(removed: RemovedCard): void {
    this.patchColumns(removed.boardId, (columns) =>
      columns.map((column) => {
        if (column.id !== removed.columnId) return column;
        const cards = [...column.cards];
        cards.splice(clamp(removed.index, 0, cards.length), 0, removed.card);
        return { ...column, cards };
      }),
    );
  }

  resetDemo(): void {
    this.setState(() => createDemoState());
  }

  private load(): BoardState {
    const saved = this.storage.get<BoardState>(STORAGE_KEY);
    if (saved?.version === 1 && Array.isArray(saved.boards) && Array.isArray(saved.members)) {
      return saved;
    }
    const demo = createDemoState();
    this.storage.set(STORAGE_KEY, demo);
    return demo;
  }

  private setState(update: (state: BoardState) => BoardState): void {
    this.state.update(update);
    this.storage.set(STORAGE_KEY, this.state());
  }

  private patchBoard(boardId: string, update: (board: Board) => Board): void {
    this.setState((state) => ({
      ...state,
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...update(board), updatedAt: todayIso() } : board,
      ),
    }));
  }

  private patchColumns(boardId: string, update: (columns: Column[]) => Column[]): void {
    this.patchBoard(boardId, (board) => ({ ...board, columns: update(board.columns) }));
  }
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(clamp(to, 0, copy.length), 0, item);
  return copy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
