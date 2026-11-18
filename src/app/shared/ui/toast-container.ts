import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent } from './icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast">
          <span class="message">{{ toast.message }}</span>
          @if (toast.actionLabel) {
            <button type="button" class="action" (click)="toastService.runAction(toast)">
              {{ toast.actionLabel }}
            </button>
          }
          <button
            type="button"
            class="close"
            aria-label="Dismiss"
            (click)="toastService.dismiss(toast.id)"
          >
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      bottom: 20px;
      left: 50%;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: max-content;
      max-width: calc(100vw - 32px);
      transform: translateX(-50%);
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px 10px 16px;
      border-radius: var(--radius-sm);
      background: #1b2232;
      color: #f3f5f9;
      box-shadow: var(--shadow-lg);
      animation: slide-up 0.18s ease-out;
    }

    .message {
      flex: 1;
    }

    .action {
      border: 0;
      background: none;
      color: #8fb2ff;
      font-weight: 600;
      cursor: pointer;
    }

    .close {
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 6px;
      background: none;
      color: #aab2c5;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
