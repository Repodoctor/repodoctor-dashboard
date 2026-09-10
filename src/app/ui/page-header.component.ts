import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div>
      @if (eyebrow()) {
        <p class="text-xs uppercase tracking-[0.2em] text-moss-400">{{ eyebrow() }}</p>
      }
      <h1 class="text-3xl font-semibold" [class.mt-1]="eyebrow()">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="mt-1 text-sm text-ink-200">{{ subtitle() }}</p>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
