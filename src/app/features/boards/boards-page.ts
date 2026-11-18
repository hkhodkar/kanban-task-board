import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Board, Member } from '../../core/models/board.models';
import { BoardStore } from '../../core/services/board-store';
import { dueStatus, isDoneColumn } from '../../core/utils/card.utils';
import { todayIso } from '../../core/utils/date.utils';
import { AvatarComponent } from '../../shared/ui/avatar';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { IconComponent } from '../../shared/ui/icon';
import { ToastService } from '../../shared/ui/toast.service';
import { BoardFormDialogComponent, BoardFormValue } from './board-form-dialog';

interface BoardSummary {
  board: Board;
  cardCount: number;
  doneCount: number;
  overdueCount: number;
  progress: number;
  members: Member[];
}

@Component({
  selector: 'app-boards-page',
  imports: [
    RouterLink,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    AvatarComponent,
    IconComponent,
    BoardFormDialogComponent,
  ],
  templateUrl: './boards-page.html',
  styleUrl: './boards-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsPageComponent {
  private readonly store = inject(BoardStore);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** null = closed, 'new' = create dialog, otherwise the board being edited */
  protected readonly dialog = signal<'new' | Board | null>(null);

  protected readonly summaries = computed<BoardSummary[]>(() => {
    const today = todayIso();
    const members = this.store.members();
    return this.store.boards().map((board) => {
      const cards = board.columns.flatMap((column) => column.cards);
      const doneCount = board.columns
        .filter(isDoneColumn)
        .reduce((sum, column) => sum + column.cards.length, 0);
      const assigneeIds = new Set(cards.map((card) => card.assigneeId));
      return {
        board,
        cardCount: cards.length,
        doneCount,
        overdueCount: board.columns
          .filter((column) => !isDoneColumn(column))
          .flatMap((column) => column.cards)
          .filter((card) => dueStatus(card, today) === 'overdue').length,
        progress: cards.length ? Math.round((doneCount / cards.length) * 100) : 0,
        members: members.filter((member) => assigneeIds.has(member.id)),
      };
    });
  });

  protected readonly totalCards = computed(() =>
    this.summaries().reduce((sum, summary) => sum + summary.cardCount, 0),
  );

  protected editingBoard(): Board | null {
    const dialog = this.dialog();
    return dialog && dialog !== 'new' ? dialog : null;
  }

  protected openCreate(): void {
    this.dialog.set('new');
  }

  protected openEdit(board: Board): void {
    this.dialog.set(board);
  }

  protected closeDialog(): void {
    this.dialog.set(null);
  }

  protected save(value: BoardFormValue): void {
    const editing = this.editingBoard();
    this.dialog.set(null);
    if (editing) {
      this.store.updateBoard(editing.id, { name: value.name, description: value.description });
      return;
    }
    const board = this.store.createBoard(value.name, value.template);
    if (value.description) {
      this.store.updateBoard(board.id, { description: value.description });
    }
    this.router.navigate(['/boards', board.id]);
  }

  protected async remove(board: Board): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete board?',
      message: `"${board.name}" and all of its cards will be deleted. This cannot be undone.`,
      confirmLabel: 'Delete board',
      danger: true,
    });
    if (confirmed) {
      this.store.deleteBoard(board.id);
      this.toast.show('Board deleted');
    }
  }
}
