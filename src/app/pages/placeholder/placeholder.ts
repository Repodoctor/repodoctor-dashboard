import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placeholder.html',
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Coming later';
  readonly detail =
    (this.route.snapshot.data['detail'] as string | undefined) ??
    'This surface is routed and will bind to gateway APIs in a later phase.';
}
