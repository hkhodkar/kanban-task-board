import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  action?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, options: { actionLabel?: string; action?: () => void } = {}): void {
    const toast: Toast = { id: this.nextId++, message, ...options };
    this.toasts.update((toasts) => [...toasts.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), options.action ? 6000 : 3500);
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  runAction(toast: Toast): void {
    toast.action?.();
    this.dismiss(toast.id);
  }
}
