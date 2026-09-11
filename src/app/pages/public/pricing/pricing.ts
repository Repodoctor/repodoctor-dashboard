import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FREE_PLAN } from '../../../utils/plan';

@Component({
  selector: 'app-pricing-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pricing.html',
})
export class PricingPage {
  readonly plan = FREE_PLAN;
}
