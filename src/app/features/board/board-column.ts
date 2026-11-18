import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Card, Column, Label, Member } from '../../core/models/board.models';
import { isDoneColumn } from '../../core/utils/card.utils';
import { AutofocusDirective } from '../../shared/directives/autofocus';
import { IconComponent } from '../../shared/ui/icon';
import { TaskCardComponent } from './task-card';

export const DRAG_DELAY = { touch: 200, mouse: 0 };

@Component({
  selector: 'app-board-column',
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    AutofocusDirective,
    IconComponent,
    TaskCardComponent,
  ],
  templateUrl: './board-column.html',
  styleUrl: './board-column.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardColumnComponent {
  readonly column = input.required<Column>();
  /** cards to show, can be a filtered subset of column.cards */
  readonly cards = input.required<Card[]>();
  readonly labels = input.required<Label[]>();
  readonly members = input.required<Member[]>();
  readonly connectedTo = input<string[]>([]);
  readonly filtered = input(false);

  readonly cardDropped = output<CdkDragDrop<string, string, Card>>();
  readonly cardOpened = output<string>();
  readonly cardAdded = output<string>();
  readonly renamed = output<string>();
  readonly deleted = output<void>();

  protected readonly dragDelay = DRAG_DELAY;
  protected readonly editingTitle = signal(false);
  protected readonly addingCard = signal(false);
  protected readonly done = computed(() => isDoneColumn(this.column()));

  protected startRename(): void {
    this.editingTitle.set(true);
  }

  protected finishRename(input: HTMLInputElement): void {
    if (!this.editingTitle()) return;
    const title = input.value.trim();
    this.editingTitle.set(false);
    if (title && title !== this.column().title) {
      this.renamed.emit(title);
    }
  }

  protected cancelRename(): void {
    this.editingTitle.set(false);
  }

  protected onRenameKeydown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.finishRename(input);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      this.cancelRename();
    }
  }

  protected openAddCard(): void {
    this.addingCard.set(true);
  }

  protected closeAddCard(): void {
    this.addingCard.set(false);
  }

  protected submitCard(textarea: HTMLTextAreaElement): void {
    const title = textarea.value.trim();
    if (title) {
      this.cardAdded.emit(title);
    }
    // keep the form open so several cards can be added in a row
    textarea.value = '';
    textarea.focus();
  }

  protected onAddKeydown(event: KeyboardEvent, textarea: HTMLTextAreaElement): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitCard(textarea);
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      this.closeAddCard();
    }
  }

  protected onDrop(event: CdkDragDrop<string, string, Card>): void {
    this.cardDropped.emit(event);
  }

  protected openCard(cardId: string): void {
    this.cardOpened.emit(cardId);
  }

  protected requestDelete(): void {
    this.deleted.emit();
  }
}
