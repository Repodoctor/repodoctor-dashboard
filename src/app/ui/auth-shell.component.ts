import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-shell',
  template: `
    <div class="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div class="w-full space-y-4" [class.text-center]="center()">
        <p class="text-sm uppercase tracking-[0.2em] text-moss-400">RepoDoctor</p>
        <ng-content />
      </div>
    </div>
  `,
})
export class AuthShellComponent {
  readonly center = input(false);
}
