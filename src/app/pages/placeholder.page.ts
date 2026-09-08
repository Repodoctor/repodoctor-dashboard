import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  template: `
    <div class="rd-card">
      <h1 class="text-2xl font-semibold">{{ title }}</h1>
      <p class="mt-2 text-sm text-ink-200">{{ detail }}</p>
      <a routerLink="/dashboard" class="rd-btn-ghost mt-4">Back to dashboard</a>
    </div>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Coming later';
  readonly detail =
    (this.route.snapshot.data['detail'] as string | undefined) ??
    'This surface is routed and will bind to gateway APIs in a later phase.';
}
