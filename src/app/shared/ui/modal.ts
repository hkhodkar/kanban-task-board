import { ChangeDetectionStrategy, Component, OnDestroy, input, output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { IconComponent } from './icon';

// open modals, newest last, so Escape only closes the top one
const openModals: ModalComponent[] = [];

@Component({
  selector: 'app-modal',
  imports: [A11yModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    <div class="backdrop" (mousedown)="onBackdropDown($event)" (click)="onBackdropClick($event)">
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
        [style.max-width.px]="width()"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <header class="modal-header">
          <h2>{{ title() }}</h2>
          <button type="button" class="icon-btn" aria-label="Close" (click)="close()">
            <app-icon name="x" />
          </button>
        </header>
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 900;
      display: grid;
      place-items: center;
      padding: 16px;
      overflow-y: auto;
      background: rgba(10, 14, 26, 0.5);
      animation: fade-in 0.15s ease-out;
    }

    .modal {
      width: 100%;
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      animation: pop-in 0.18s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px 0 24px;

      h2 {
        font-size: 18px;
      }
    }

    :host ::ng-deep .modal-body {
      padding: 20px 24px 24px;
    }

    :host ::ng-deep .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 560px) {
      .backdrop {
        padding: 8px;
      }

      .modal {
        max-height: calc(100dvh - 16px);
      }

      .modal-header {
        padding: 16px 12px 0 16px;
      }

      :host ::ng-deep .modal-body {
        padding: 16px;
      }

      :host ::ng-deep .modal-footer {
        padding: 12px 16px;
      }
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
    }

    @keyframes pop-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
    }
  `,
})
export class ModalComponent implements OnDestroy {
  readonly title = input.required<string>();
  readonly width = input(520);
  readonly closed = output<void>();

  private pressedBackdrop = false;

  constructor() {
    openModals.push(this);
  }

  ngOnDestroy(): void {
    openModals.splice(openModals.indexOf(this), 1);
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onEscape(): void {
    if (openModals.at(-1) === this) {
      this.close();
    }
  }

  protected onBackdropDown(event: MouseEvent): void {
    this.pressedBackdrop = event.target === event.currentTarget;
  }

  // only close when the whole click happened on the backdrop, not a drag out of an input
  protected onBackdropClick(event: MouseEvent): void {
    if (this.pressedBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }
}
