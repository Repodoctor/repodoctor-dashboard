import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.html',
})
export class ProductsPage {
  readonly products = [
    {
      name: 'GitHub connection',
      body: 'Install the GitHub App, keep a tenant-safe catalog, and scan the repositories you can actually open.',
    },
    {
      name: 'Scanner orchestration',
      body: 'One worker runs pinned Semgrep today, then Gitleaks and Trivy. Findings are normalized, not invented.',
    },
    {
      name: 'Code, Secrets, Supply chain',
      body: 'Semgrep fills Code. Gitleaks fills Secrets without storing raw values. Trivy fills Supply chain.',
    },
    {
      name: 'Access control',
      body: 'Workspace roles plus per-repository grants, including NONE so members never see a private repo.',
    },
  ];
}
