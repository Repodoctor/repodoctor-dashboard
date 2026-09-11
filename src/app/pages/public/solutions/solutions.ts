import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-solutions-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solutions.html',
})
export class SolutionsPage {
  readonly solutions = [
    {
      name: 'Platform teams',
      body: 'One organization per product area. Members see only the repositories you grant. NONE hides the rest.',
    },
    {
      name: 'Security reviews',
      body: 'Findings and analysis history in one place. AI explanations are planned and will stay grounded in analyzer facts.',
    },
    {
      name: 'CI reliability',
      body: 'CI Doctor will cluster failing jobs and flaky suites. That surface is in progress during alpha.',
    },
  ];
}
