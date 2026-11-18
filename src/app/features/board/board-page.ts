import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Board, Card, Column } from '../../core/models/board.models';
import { BoardStore } from '../../core/services/board-store';
import { dueStatus, isDoneColumn, toFullIndex } from '../../core/utils/card.utils';
import { todayIso } from '../../core/utils/date.utils';
import { AutofocusDirective } from '../../shared/directives/autofocus';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { IconComponent } from '../../shared/ui/icon';
import { ToastService } from '../../shared/ui/toast.service';
import { BoardFormDialogComponent, BoardFormValue } from '../boards/board-form-dialog';
import { BoardColumnComponent, DRAG_DELAY } from './board-column';

@Component({
  selector: 'app-board-page',
  imports: [
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkScrollable,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    AutofocusDirective,
    IconComponent,
    BoardColumnComponent,
    BoardFormDialogComponent,
  ],
  templateUrl: './board-page.html',
  styleUrl: './board-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPageComponent {
  private readonly store = inject(BoardStore);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** route param */
  readonly boardId = input.required<string>();

  protected readonly dragDelay = DRAG_DELAY;
  protected readonly members = this.store.members;
  protected readonly board = computed(() => this.store.getBoard(this.boardId()));
  protected readonly columnIds = computed(() => this.board()?.columns.map((c) => c.id) ?? []);
  protected readonly addingColumn = signal(false);
  protected readonly editingBoard = signal(false);

  protected readonly visibleCards = computed<Record<string, Card[]>>(() => {
    const result: Record<string, Card[]> = {};
    for (const column of this.board()?.columns ?? []) {
      result[column.id] = column.cards;
    }
    return result;
  });

  protected readonly stats = computed(() => {
    const today = todayIso();
    const open = (this.board()?.columns ?? [])
      .filter((column) => !isDoneColumn(column))
      .flatMap((column) => column.cards);
    const total = this.board()?.columns.reduce((sum, c) => sum + c.cards.length, 0) ?? 0;
    return {
      total,
      overdue: open.filter((card) => dueStatus(card, today) === 'overdue').length,
      dueSoon: open.filter((card) => {
        const status = dueStatus(card, today);
        return status === 'today' || status === 'soon';
      }).length,
    };
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const name = this.board()?.name ?? 'Board not found';
      title.setTitle(`${name} · Kanban Task Board`);
    });
  }

  // Cards

  protected onCardDrop(event: CdkDragDrop<string, string, Card>): void {
    const board = this.board();
    if (!board) return;
    const card = event.item.data;
    const target = board.columns.find((column) => column.id === event.container.data);
    if (!target) return;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    // the drop index refers to the visible (maybe filtered) list, map it to the real one
    const full = target.cards.filter((c) => c.id !== card.id);
    const visible = this.visibleCards()[target.id].filter((c) => c.id !== card.id);
    this.store.moveCard(
      board.id,
      card.id,
      target.id,
      toFullIndex(full, visible, event.currentIndex),
    );
  }

  protected addCard(column: Column, title: string): void {
    const board = this.board();
    if (board) {
      this.store.addCard(board.id, column.id, title);
    }
  }

  protected openCard(cardId: string): void {
    // card details are added in the next step
    void cardId;
  }

  // Columns

  protected onColumnDrop(event: CdkDragDrop<Column[]>): void {
    const board = this.board();
    if (board) {
      this.store.moveColumn(board.id, event.previousIndex, event.currentIndex);
    }
  }

  protected openAddColumn(): void {
    this.addingColumn.set(true);
  }

  protected closeAddColumn(): void {
    this.addingColumn.set(false);
  }

  protected submitColumn(input: HTMLInputElement): void {
    const board = this.board();
    const title = input.value.trim();
    if (!board || !title) {
      input.focus();
      return;
    }
    this.store.addColumn(board.id, title);
    input.value = '';
    input.focus();
  }

  protected onColumnKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submitColumn(input);
    } else if (event.key === 'Escape') {
      this.closeAddColumn();
    }
  }

  protected renameColumn(column: Column, title: string): void {
    const board = this.board();
    if (board) {
      this.store.renameColumn(board.id, column.id, title);
    }
  }

  protected async deleteColumn(column: Column): Promise<void> {
    const board = this.board();
    if (!board) return;
    if (column.cards.length) {
      const confirmed = await this.confirm.confirm({
        title: 'Delete column?',
        message: `"${column.title}" and its ${column.cards.length} ${column.cards.length === 1 ? 'card' : 'cards'} will be deleted.`,
        confirmLabel: 'Delete column',
        danger: true,
      });
      if (!confirmed) return;
    }
    this.store.deleteColumn(board.id, column.id);
    this.toast.show(`Column "${column.title}" deleted`);
  }

  // Board

  protected openEditBoard(): void {
    this.editingBoard.set(true);
  }

  protected closeEditBoard(): void {
    this.editingBoard.set(false);
  }

  protected saveBoard(value: BoardFormValue): void {
    const board = this.board();
    this.editingBoard.set(false);
    if (board) {
      this.store.updateBoard(board.id, { name: value.name, description: value.description });
    }
  }

  protected async deleteBoard(board: Board): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete board?',
      message: `"${board.name}" and all of its cards will be deleted. This cannot be undone.`,
      confirmLabel: 'Delete board',
      danger: true,
    });
    if (confirmed) {
      this.store.deleteBoard(board.id);
      this.toast.show('Board deleted');
      this.router.navigate(['/']);
    }
  }
}
