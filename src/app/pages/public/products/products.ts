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
      name: 'Repository catalog',
      body: 'Connect GitHub App installations, keep a tenant-safe catalog, and see which repos you can actually open.',
    },
    {
      name: 'Findings',
      body: 'Severity-ranked issues from analyzers, not from a chatbot. The dashboard reads them through the gateway.',
    },
    {
      name: 'Analysis runs',
      body: 'Queue FULL diagnostics when overview signals are not enough. History and status stay on the repository.',
    },
    {
      name: 'Access control',
      body: 'Organization roles plus per-repository grants, including NONE so members never see a private repo.',
    },
  ];
}
