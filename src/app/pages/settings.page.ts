import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-settings-page',
  template: `
    <div class="space-y-4">
      <h1 class="text-3xl font-semibold">Settings</h1>
      <div class="rd-card space-y-2">
        <p><span class="text-ink-200">Name</span> · {{ auth.user()?.displayName }}</p>
        <p><span class="text-ink-200">Email</span> · {{ auth.user()?.email }}</p>
        <p class="text-sm text-ink-300">
          The dashboard never receives service-role keys, SCM credentials, or worker endpoints.
        </p>
      </div>
    </div>
  `,
})
export class SettingsPage {
  readonly auth = inject(AuthService);
}
