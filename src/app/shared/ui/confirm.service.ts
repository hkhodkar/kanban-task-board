import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.request()?.resolve(false);
    return new Promise((resolve) => this.request.set({ ...options, resolve }));
  }

  answer(confirmed: boolean): void {
    this.request()?.resolve(confirmed);
    this.request.set(null);
  }
}
