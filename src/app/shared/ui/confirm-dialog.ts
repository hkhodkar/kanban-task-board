import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';
import { ModalComponent } from './modal';

@Component({
  selector: 'app-confirm-dialog',
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.request(); as request) {
      <app-modal [title]="request.title" [width]="420" (closed)="confirm.answer(false)">
        <div class="modal-body">
          <p class="message">{{ request.message }}</p>
        </div>
        <footer class="modal-footer">
          <button type="button" class="btn" (click)="confirm.answer(false)">Cancel</button>
          <button
            type="button"
            class="btn"
            cdkFocusInitial
            [class.btn-danger]="request.danger"
            [class.btn-primary]="!request.danger"
            (click)="confirm.answer(true)"
          >
            {{ request.confirmLabel ?? 'Confirm' }}
          </button>
        </footer>
      </app-modal>
    }
  `,
  styles: `
    .message {
      color: var(--text-muted);
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);
}
