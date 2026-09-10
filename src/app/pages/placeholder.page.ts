import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <h1 class="text-2xl font-semibold">{{ title }}</h1>
        <p class="mt-2 text-sm text-ink-200">{{ detail }}</p>
        <a mat-stroked-button class="mt-4" routerLink="/dashboard">Back to dashboard</a>
      </mat-card-content>
    </mat-card>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Coming later';
  readonly detail =
    (this.route.snapshot.data['detail'] as string | undefined) ??
    'This surface is routed and will bind to gateway APIs in a later phase.';
}
