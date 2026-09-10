import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthShellComponent } from '../../components/auth-shell/auth-shell';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, MatButtonModule, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error.html',
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);
  readonly message =
    this.route.snapshot.queryParamMap.get('message')?.trim() ||
    'This email link is invalid or has expired.';
}
