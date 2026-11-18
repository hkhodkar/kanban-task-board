import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BOARD_TEMPLATES, BoardTemplate } from '../../core/data/seed-data';
import { Board } from '../../core/models/board.models';
import { ModalComponent } from '../../shared/ui/modal';

export interface BoardFormValue {
  name: string;
  description: string;
  template: BoardTemplate;
}

@Component({
  selector: 'app-board-form-dialog',
  imports: [ReactiveFormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [title]="board() ? 'Edit board' : 'New board'"
      [width]="480"
      (closed)="cancelled.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="modal-body form-stack">
          <div class="field">
            <label for="board-name">Name</label>
            <input
              id="board-name"
              class="input"
              formControlName="name"
              placeholder="e.g. Product launch"
              maxlength="60"
              autocomplete="off"
              cdkFocusInitial
            />
            @if (form.controls.name.invalid && form.controls.name.touched) {
              <span class="field-error">Give the board a name.</span>
            }
          </div>

          <div class="field">
            <label for="board-description">
              Description <span class="optional">(optional)</span>
            </label>
            <textarea
              id="board-description"
              class="textarea"
              formControlName="description"
              rows="3"
              maxlength="200"
              placeholder="What is this board for?"
            ></textarea>
          </div>

          @if (!board()) {
            <div class="field">
              <label for="board-template">Template</label>
              <select
                id="board-template"
                class="select"
                formControlName="template"
                aria-describedby="template-columns"
              >
                @for (template of templates; track template.value) {
                  <option [value]="template.value">{{ template.name }}</option>
                }
              </select>
              <span class="hint" id="template-columns">{{ templateHint() }}</span>
            </div>
          }
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn" (click)="cancelled.emit()">Cancel</button>
          <button type="submit" class="btn btn-primary">
            {{ board() ? 'Save' : 'Create board' }}
          </button>
        </footer>
      </form>
    </app-modal>
  `,
  styles: `
    .hint {
      font-size: 12px;
      color: var(--text-muted);
    }

    .optional {
      font-weight: 400;
      opacity: 0.8;
    }
  `,
})
export class BoardFormDialogComponent implements OnInit {
  /** board to edit, empty when creating a new one */
  readonly board = input<Board | null>(null);
  readonly saved = output<BoardFormValue>();
  readonly cancelled = output<void>();

  protected readonly templates = BOARD_TEMPLATES;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', Validators.maxLength(200)],
    template: ['scrum' as BoardTemplate],
  });

  private readonly template = toSignal(this.form.controls.template.valueChanges, {
    initialValue: this.form.controls.template.value,
  });

  protected readonly templateHint = computed(() => {
    const columns = this.templates.find((t) => t.value === this.template())?.columns ?? [];
    return columns.length ? `Columns: ${columns.join(', ')}` : 'Start without columns';
  });

  ngOnInit(): void {
    const board = this.board();
    if (board) {
      this.form.patchValue({ name: board.name, description: board.description });
    }
  }

  protected submit(): void {
    const name = this.form.controls.name.value.trim();
    if (!name) {
      this.form.controls.name.setValue('');
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({ ...value, name, description: value.description.trim() });
  }
}
