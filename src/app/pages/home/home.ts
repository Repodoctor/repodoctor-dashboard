import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class HomePage {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  constructor() {
    void this.auth.whenReady().then(() => {
      this.auth.consumeAuthUrlError();
      if (this.auth.pendingPassword()) {
        void this.router.navigateByUrl(this.auth.passwordSetupUrl());
      }
    });
  }
  readonly services = [
    {
      name: 'Gateway',
      title: 'Unified API surface',
      description:
        'The dashboard speaks only to repodoctor-gateway at /api/v1. Auth, tenancy, and service orchestration stay out of the browser.',
    },
    {
      name: 'Overview',
      title: 'Repository health at a glance',
      description:
        'Roll up severity, last analysis, and drift into a single overview so you know which repos need attention first.',
    },
    {
      name: 'Findings',
      title: 'Severity-ranked issues',
      description:
        'Surface actionable findings from the Findings service — critical paths, policy breaks, and debt that will bite production.',
    },
    {
      name: 'Graph',
      title: 'RepoGraph dependency map',
      description:
        'Explore ownership and dependency topology from RepoGraph to see blast radius before you change a shared package.',
    },
    {
      name: 'CI',
      title: 'Pipeline failure signals',
      description:
        'Track recent CI runs, flaky suites, and failure clusters so broken main never hides behind noisy logs.',
    },
    {
      name: 'Analysis',
      title: 'Deep diagnostic jobs',
      description:
        'Kick off and review deeper analysis reports when overview signals are not enough — status and history in one place.',
    },
  ];
}
