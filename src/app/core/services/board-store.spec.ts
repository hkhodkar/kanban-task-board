import { TestBed } from '@angular/core/testing';
import { BoardStore, STORAGE_KEY } from './board-store';

function columnTitles(store: BoardStore, boardId: string): string[] {
  return store.getBoard(boardId)!.columns.map((c) => c.title);
}

function cardTitles(store: BoardStore, boardId: string, columnIndex: number): string[] {
  return store.getBoard(boardId)!.columns[columnIndex].cards.map((c) => c.title);
}

describe('BoardStore', () => {
  let store: BoardStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    store = TestBed.inject(BoardStore);
  });

  it('seeds the demo boards on first run', () => {
    const relaunch = store.getBoard('website-relaunch')!;
    expect(store.boards().length).toBe(3);
    expect(relaunch.columns.map((c) => c.title)).toEqual([
      'Backlog',
      'To do',
      'In progress',
      'Review',
      'Done',
    ]);
    const cardCount = relaunch.columns.reduce((sum, c) => sum + c.cards.length, 0);
    expect(cardCount).toBeGreaterThanOrEqual(15);
  });

  it('creates a board from a template', () => {
    const board = store.createBoard('  Side project ', 'basic');
    expect(board.name).toBe('Side project');
    expect(columnTitles(store, board.id)).toEqual(['To do', 'In progress', 'Done']);
    expect(board.labels.length).toBeGreaterThan(0);
  });

  it('renames and deletes boards', () => {
    const board = store.createBoard('Temp', 'empty');
    store.updateBoard(board.id, { name: 'Renamed' });
    expect(store.getBoard(board.id)?.name).toBe('Renamed');

    store.deleteBoard(board.id);
    expect(store.getBoard(board.id)).toBeUndefined();
  });

  it('adds, renames, reorders and deletes columns', () => {
    const board = store.createBoard('Columns', 'basic');
    const qa = store.addColumn(board.id, 'QA');
    expect(columnTitles(store, board.id)).toEqual(['To do', 'In progress', 'Done', 'QA']);

    store.renameColumn(board.id, qa.id, 'Testing');
    store.moveColumn(board.id, 3, 2);
    expect(columnTitles(store, board.id)).toEqual(['To do', 'In progress', 'Testing', 'Done']);

    store.deleteColumn(board.id, qa.id);
    expect(columnTitles(store, board.id)).toEqual(['To do', 'In progress', 'Done']);
  });

  it('moves a card to another column at a given position', () => {
    const board = store.createBoard('Moves', 'basic');
    const [todo, doing] = store.getBoard(board.id)!.columns;
    const a = store.addCard(board.id, todo.id, 'A');
    store.addCard(board.id, todo.id, 'B');
    store.addCard(board.id, doing.id, 'C');
    store.addCard(board.id, doing.id, 'D');

    store.moveCard(board.id, a.id, doing.id, 1);

    expect(cardTitles(store, board.id, 0)).toEqual(['B']);
    expect(cardTitles(store, board.id, 1)).toEqual(['C', 'A', 'D']);
  });

  it('reorders cards inside a column', () => {
    const board = store.createBoard('Reorder', 'basic');
    const todo = store.getBoard(board.id)!.columns[0];
    const a = store.addCard(board.id, todo.id, 'A');
    store.addCard(board.id, todo.id, 'B');
    store.addCard(board.id, todo.id, 'C');

    store.moveCard(board.id, a.id, todo.id, 2);
    expect(cardTitles(store, board.id, 0)).toEqual(['B', 'C', 'A']);
  });

  it('updates card details', () => {
    const board = store.createBoard('Edit', 'basic');
    const todo = store.getBoard(board.id)!.columns[0];
    const card = store.addCard(board.id, todo.id, 'Draft');

    store.updateCard(board.id, card.id, {
      title: 'Final',
      dueDate: '2030-01-15',
      assigneeId: 'm-mia',
    });

    const updated = store.findCard(board.id, card.id)!.card;
    expect(updated).toMatchObject({ title: 'Final', dueDate: '2030-01-15', assigneeId: 'm-mia' });
  });

  it('deletes a card and can restore it at the same position', () => {
    const board = store.createBoard('Undo', 'basic');
    const todo = store.getBoard(board.id)!.columns[0];
    store.addCard(board.id, todo.id, 'A');
    const b = store.addCard(board.id, todo.id, 'B');
    store.addCard(board.id, todo.id, 'C');

    const removed = store.deleteCard(board.id, b.id)!;
    expect(cardTitles(store, board.id, 0)).toEqual(['A', 'C']);

    store.restoreCard(removed);
    expect(cardTitles(store, board.id, 0)).toEqual(['A', 'B', 'C']);
  });

  it('persists changes to localStorage and loads them again', () => {
    const board = store.createBoard('Persisted', 'scrum');
    store.addCard(board.id, board.columns[0].id, 'Saved card');

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.boards.some((b: { name: string }) => b.name === 'Persisted')).toBe(true);

    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(BoardStore);
    expect(cardTitles(reloaded, board.id, 0)).toEqual(['Saved card']);
  });

  it('falls back to demo data when storage is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    TestBed.resetTestingModule();
    const fresh = TestBed.inject(BoardStore);
    expect(fresh.getBoard('website-relaunch')).toBeDefined();
  });

  it('resets back to the demo data', () => {
    store.deleteBoard('website-relaunch');
    store.createBoard('Mine', 'basic');

    store.resetDemo();

    expect(store.getBoard('website-relaunch')).toBeDefined();
    expect(store.boards().some((b) => b.name === 'Mine')).toBe(false);
  });
});
