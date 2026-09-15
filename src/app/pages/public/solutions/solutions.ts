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
      body: 'One workspace per product area. Members see only the repositories you grant. NONE hides the rest.',
    },
    {
      name: 'Security reviews',
      body: 'Code, secrets, and supply-chain findings in one place. OpenRouter can explain after scanners produce evidence.',
    },
    {
      name: 'Safe fixes later',
      body: 'Autofix, validation, and GitHub PRs stay in this worker. They will only run on findings marked SAFE.',
    },
  ];
}
