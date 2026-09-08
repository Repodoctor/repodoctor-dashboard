import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, kind: ToastMessage['kind'] = 'info', ttlMs = 6000): void {
    const toast: ToastMessage = { id: this.nextId++, message, kind };
    this.toastsSignal.update((items) => [...items, toast]);
    window.setTimeout(() => this.dismiss(toast.id), ttlMs);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((items) => items.filter((item) => item.id !== id));
  }
}
