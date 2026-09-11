import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InProgressComponent } from '../../components/in-progress/in-progress';

@Component({
  selector: 'app-placeholder-page',
  imports: [InProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placeholder.html',
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'This page is in progress';
  readonly detail =
    (this.route.snapshot.data['detail'] as string | undefined) ??
    'This surface is routed and will bind to gateway APIs in a later phase. Nothing to configure here yet.';
}
