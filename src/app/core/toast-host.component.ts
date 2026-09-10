import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-4">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto w-full max-w-md rounded-md border px-4 py-3 text-sm shadow-glow"
          [class]="
            toast.kind === 'error'
              ? 'border-red-500/40 bg-red-950/90 text-red-100'
              : toast.kind === 'success'
                ? 'border-moss-400/50 bg-ink-700 text-moss-100'
                : 'border-ink-400 bg-ink-700 text-moss-100'
          "
          role="status"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
