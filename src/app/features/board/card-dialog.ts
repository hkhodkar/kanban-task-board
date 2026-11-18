import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Board, Card, CardChanges, Member } from '../../core/models/board.models';
import { formatShortDate } from '../../core/utils/date.utils';
import { createId } from '../../core/utils/id';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { IconComponent } from '../../shared/ui/icon';
import { ModalComponent } from '../../shared/ui/modal';

export interface CardDialogResult {
  changes: CardChanges;
  columnId: string;
}

type ChecklistGroup = FormGroup<{
  id: FormControl<string>;
  text: FormControl<string>;
  done: FormControl<boolean>;
}>;

@Component({
  selector: 'app-card-dialog',
  imports: [ReactiveFormsModule, ModalComponent, IconComponent],
  templateUrl: './card-dialog.html',
  styleUrl: './card-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDialogComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly confirm = inject(ConfirmService);

  readonly board = input.required<Board>();
  readonly card = input.required<Card>();
  readonly columnId = input.required<string>();
  readonly members = input.required<Member[]>();

  readonly saved = output<CardDialogResult>();
  readonly deleted = output<void>();
  readonly closed = output<void>();

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(2000)],
    columnId: [''],
    assigneeId: [''],
    dueDate: [''],
    labelIds: this.fb.control<string[]>([]),
    checklist: this.fb.array<ChecklistGroup>([]),
  });

  protected readonly newItem = this.fb.control('');
  protected readonly addingItem = signal(false);

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly selectedLabels = computed(() => this.formValue().labelIds ?? []);

  protected readonly checklistDone = computed(
    () => (this.formValue().checklist ?? []).filter((item) => item.done).length,
  );

  protected readonly checklistTotal = computed(() => (this.formValue().checklist ?? []).length);

  protected readonly createdLabel = computed(() => formatShortDate(this.card().createdAt));

  get checklist(): FormArray<ChecklistGroup> {
    return this.form.controls.checklist;
  }

  ngOnInit(): void {
    const card = this.card();
    this.form.patchValue({
      title: card.title,
      description: card.description,
      columnId: this.columnId(),
      assigneeId: card.assigneeId ?? '',
      dueDate: card.dueDate ?? '',
      labelIds: [...card.labelIds],
    });
    for (const item of card.checklist) {
      this.checklist.push(this.createItem(item.text, item.done, item.id));
    }
    this.form.markAsPristine();
  }

  protected toggleLabel(labelId: string): void {
    const control = this.form.controls.labelIds;
    const current = control.value;
    control.setValue(
      current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId],
    );
    control.markAsDirty();
  }

  protected clearDueDate(): void {
    this.form.controls.dueDate.setValue('');
    this.form.controls.dueDate.markAsDirty();
  }

  protected addItem(): void {
    const text = this.newItem.value.trim();
    if (!text) return;
    this.checklist.push(this.createItem(text, false));
    this.checklist.markAsDirty();
    this.newItem.setValue('');
  }

  protected onNewItemKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addItem();
    }
  }

  protected removeItem(index: number): void {
    this.checklist.removeAt(index);
    this.checklist.markAsDirty();
  }

  protected submit(): void {
    const title = this.form.controls.title.value.trim();
    if (!title) {
      this.form.controls.title.setValue('');
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      columnId: value.columnId,
      changes: {
        title,
        description: value.description.trim(),
        assigneeId: value.assigneeId || null,
        dueDate: value.dueDate || null,
        labelIds: value.labelIds,
        checklist: value.checklist
          .map((item) => ({ ...item, text: item.text.trim() }))
          .filter((item) => item.text),
      },
    });
  }

  protected async requestClose(): Promise<void> {
    if (this.form.dirty) {
      const discard = await this.confirm.confirm({
        title: 'Discard changes?',
        message: 'You have unsaved changes on this card.',
        confirmLabel: 'Discard',
        danger: true,
      });
      if (!discard) return;
    }
    this.closed.emit();
  }

  protected requestDelete(): void {
    this.deleted.emit();
  }

  private createItem(text: string, done: boolean, id = createId('item')): ChecklistGroup {
    return this.fb.group({
      id: [id],
      text: [text, Validators.maxLength(200)],
      done: [done],
    });
  }
}
