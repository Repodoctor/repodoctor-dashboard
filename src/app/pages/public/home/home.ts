import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthStore } from '../../../stores/auth.store';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class HomePage {
  readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    if (
      query.has('installation_id') ||
      query.get('setup_action') === 'install' ||
      query.get('setup_action') === 'update'
    ) {
      const queryParams: Record<string, string> = {};
      query.keys.forEach((key) => {
        const value = query.get(key);
        if (value != null) queryParams[key] = value;
      });
      void this.router.navigate(['/settings/scm/github/callback'], { queryParams, replaceUrl: true });
      return;
    }
    void this.auth.whenReady().then(() => {
      this.auth.consumeAuthUrlError();
      if (this.auth.pendingPassword()) {
        void this.router.navigateByUrl(this.auth.passwordSetupUrl());
      }
    });
  }
  readonly services = [
    {
      name: 'Semgrep',
      title: 'Code findings',
      description:
        'Pinned Semgrep Community Edition runs in the worker. Normalized results land in the Code inbox — a crash is a failed scanner run, not an empty list.',
    },
    {
      name: 'Gitleaks',
      title: 'Secrets without raw values',
      description:
        'Credential detections go to Secrets. RepoDoctor never persists the secret itself.',
    },
    {
      name: 'Trivy',
      title: 'Supply chain and images',
      description:
        'Filesystem and dependency scanning first, container images next. Results show under Supply chain.',
    },
    {
      name: 'GitHub',
      title: 'Connect and scan',
      description:
        'Install the GitHub App, then Scan repository. Pushes queue the same worker. The App private key stays in SCM.',
    },
    {
      name: 'Findings',
      title: 'One normalized inbox',
      description:
        'Fingerprinted issues from every scanner, ranked by severity, visible through the gateway only.',
    },
    {
      name: 'OpenRouter',
      title: 'Explain after evidence',
      description:
        'AI triage is optional and only after scanner output exists. The key never ships in Angular.',
    },
  ];
}
