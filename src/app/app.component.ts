import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './core/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent],
  template: `
    <app-toast-host />
    <router-outlet />
  `,
})
export class AppComponent {
  title = 'RepoDoctor';
}
