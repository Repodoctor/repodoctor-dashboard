import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthShellComponent } from '../ui/auth-shell.component';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, MatButtonModule, AuthShellComponent],
  template: `
    <app-auth-shell [center]="true">
      <h1 class="text-3xl font-semibold">This link is no longer valid</h1>
      <p class="text-sm text-ink-200">{{ message }}</p>
      <p class="text-sm text-ink-300">
        Request a new reset email, or ask an organization admin to send a new invite.
      </p>
      <a mat-flat-button class="w-full" routerLink="/login">Sign in</a>
      <a mat-stroked-button class="w-full" routerLink="/forgot-password">Request a new reset link</a>
    </app-auth-shell>
  `,
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);
  readonly message =
    this.route.snapshot.queryParamMap.get('message')?.trim() ||
    'This email link is invalid or has expired.';
}
