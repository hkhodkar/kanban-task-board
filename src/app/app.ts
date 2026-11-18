import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BoardStore } from './core/services/board-store';
import { ThemeService } from './core/services/theme.service';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog';
import { ConfirmService } from './shared/ui/confirm.service';
import { IconComponent } from './shared/ui/icon';
import { ToastContainerComponent } from './shared/ui/toast-container';
import { ToastService } from './shared/ui/toast.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    IconComponent,
    ConfirmDialogComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = inject(ThemeService);
  private readonly store = inject(BoardStore);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected async resetDemo(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Reset demo data?',
      message:
        'All boards and cards are replaced with the original demo boards. Your changes will be lost.',
      confirmLabel: 'Reset',
      danger: true,
    });
    if (confirmed) {
      this.store.resetDemo();
      this.toast.show('Demo data restored');
      this.router.navigate(['/']);
    }
  }
}
