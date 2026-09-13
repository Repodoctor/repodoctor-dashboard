import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-docs-page',
  imports: [RouterLink, MatButtonModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './docs.html',
})
export class DocsPage {
  readonly topics = [
    {
      title: 'Sign in',
      body: 'Create an account, or accept an organization invite from email. GitHub OAuth is available on login.',
    },
    {
      title: 'Organizations',
      body: 'You can own two organizations on Free. Overview lists repositories and findings. Details, integrations, members, and permissions live in the tabs.',
    },
    {
      title: 'Repository access',
      body: 'VIEW reads. ANALYZE queues runs. MANAGE is reserved. ADMIN changes grants. NONE hides the repository from members and viewers.',
    },
    {
      title: 'Scan a repository',
      body: 'Install the GitHub App, open a repository, and click Scan repository. Semgrep runs in the worker and Code shows normalized findings.',
    },
    {
      title: 'Inboxes',
      body: 'Code is Semgrep. Secrets is Gitleaks (empty until that adapter). Supply chain is Trivy (empty until that adapter).',
    },
    {
      title: 'What is still later',
      body: 'Gitleaks, Trivy, OpenRouter triage, SAFE-only autofix, and GitHub PRs share this worker. They are not separate services.',
    },
  ];
}
