import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card, Label, Member } from '../../core/models/board.models';
import { checklistProgress, dueStatus } from '../../core/utils/card.utils';
import { formatShortDate, todayIso } from '../../core/utils/date.utils';
import { AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent } from '../../shared/ui/icon';

const DUE_TEXT = { overdue: 'Overdue', today: 'Due today', soon: 'Due soon', later: 'Due' };

@Component({
  selector: 'app-task-card',
  imports: [AvatarComponent, IconComponent],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'button',
    tabindex: '0',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.is-overdue]': "status() === 'overdue'",
    '(click)': 'open()',
    '(keydown.enter)': 'open()',
  },
})
export class TaskCardComponent {
  readonly card = input.required<Card>();
  readonly boardLabels = input.required<Label[]>();
  readonly members = input.required<Member[]>();
  /** cards in a done column don't get due date warnings */
  readonly done = input(false);
  readonly opened = output<string>();

  protected readonly labels = computed(() => {
    const ids = this.card().labelIds;
    return this.boardLabels().filter((label) => ids.includes(label.id));
  });

  protected readonly assignee = computed(
    () => this.members().find((member) => member.id === this.card().assigneeId) ?? null,
  );

  protected readonly status = computed(() => (this.done() ? null : dueStatus(this.card())));

  protected readonly dueLabel = computed(() => {
    const due = this.card().dueDate;
    if (!due) return '';
    const status = this.status();
    if (status === 'today') return 'Today';
    return formatShortDate(due, todayIso());
  });

  protected readonly dueTitle = computed(() => {
    const status = this.status();
    return `${status ? DUE_TEXT[status] : 'Due'} ${this.card().dueDate ?? ''}`;
  });

  protected readonly progress = computed(() => checklistProgress(this.card()));

  protected readonly ariaLabel = computed(() => {
    const parts = [this.card().title];
    if (this.card().dueDate) parts.push(this.dueTitle());
    const assignee = this.assignee();
    if (assignee) parts.push(`assigned to ${assignee.name}`);
    return parts.join(', ');
  });

  protected open(): void {
    this.opened.emit(this.card().id);
  }
}
