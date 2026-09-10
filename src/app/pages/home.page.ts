import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatButtonModule],
  template: `
    <div
      class="overflow-hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(62,224,178,0.16),transparent_55%),radial-gradient(ellipse_40%_30%_at_100%_20%,rgba(245,165,36,0.06),transparent_50%),#0b0f14]"
    >
      <section
        class="relative grid min-h-screen items-end gap-8 px-4 pb-12 pt-4 sm:gap-12 sm:px-6 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-12 lg:pb-16"
      >
        <div class="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-5 sm:px-6 lg:px-12">
          <a routerLink="/" class="pointer-events-auto font-mono text-xs tracking-[0.22em] text-moss-400 uppercase sm:text-sm">
            RepoDoctor
          </a>
          <div class="pointer-events-auto">
            @if (auth.isAuthenticated()) {
              <a mat-stroked-button routerLink="/dashboard">Open dashboard</a>
            } @else {
              <a mat-stroked-button routerLink="/login">Log in</a>
            }
          </div>
        </div>

        <div class="relative z-10 max-w-xl animate-home-rise pt-20 sm:pt-24">
          <p class="font-mono text-xs tracking-[0.22em] text-moss-400 uppercase sm:text-sm">RepoDoctor</p>
          <h1 class="mt-4 text-[clamp(2.25rem,8vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-moss-100">
            Diagnose repositories before they fail in production.
          </h1>
          <p class="mt-5 max-w-lg text-base leading-relaxed text-ink-200 sm:text-lg">
            One dashboard for findings, dependency graphs, CI signals, and deep analysis — all through the
            RepoDoctor gateway.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            @if (auth.isAuthenticated()) {
              <a mat-flat-button routerLink="/dashboard">Open dashboard</a>
              <a mat-stroked-button routerLink="/organizations">Browse organizations</a>
            } @else {
              <a mat-flat-button routerLink="/login">Log in</a>
              <a mat-stroked-button routerLink="/signup">Create account</a>
            }
          </div>
        </div>

        <div class="relative min-h-72 animate-home-rise-delayed sm:min-h-80 lg:min-h-[28rem]" aria-hidden="true">
          <div
            class="relative h-full min-h-[inherit] overflow-hidden rounded-2xl border border-line bg-[linear-gradient(160deg,rgba(18,24,31,0.95),rgba(11,15,20,0.98))] shadow-glow"
          >
            <div
              class="pointer-events-none absolute -top-[40%] -left-[20%] h-[70%] w-[70%] animate-home-drift rounded-full bg-[radial-gradient(circle,rgba(62,224,178,0.18),transparent_65%)]"
            ></div>
            <div class="absolute inset-x-0 h-0.5 animate-home-scan bg-gradient-to-r from-transparent via-moss-400 to-transparent opacity-55"></div>
            <div class="flex items-center gap-2 border-b border-ink-400 px-4 py-3.5">
              <span class="size-2 rounded-full bg-red-400"></span>
              <span class="size-2 rounded-full bg-amber-400"></span>
              <span class="size-2 rounded-full bg-moss-400"></span>
            </div>
            <div class="grid gap-3 px-4 py-4 font-mono text-[0.72rem] leading-relaxed sm:px-5 sm:text-xs">
              <div class="grid grid-cols-[4.5rem_1fr] gap-3 text-ink-200">
                <span class="text-moss-400">gateway</span>
                <span>/api/v1 · healthy</span>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-3 text-ink-200">
                <span class="text-moss-400">findings</span>
                <span><span class="text-red-300">2 critical</span> · <span class="text-amber-300">5 warn</span></span>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-3 text-ink-200">
                <span class="text-moss-400">graph</span>
                <span>148 nodes · 312 edges synced</span>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-3 text-ink-200">
                <span class="text-moss-400">ci</span>
                <span class="text-amber-300">main failing · flaky suite</span>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-3 text-ink-200">
                <span class="text-moss-400">analysis</span>
                <span class="text-moss-300">report ready · 12m ago</span>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-3 text-ink-200">
                <span class="text-moss-400">overview</span>
                <span>health 72 · drift detected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="border-t border-ink-400 bg-gradient-to-b from-ink-700/35 to-transparent px-4 py-16 sm:px-6 sm:py-20 lg:px-12">
        <div class="mb-10 max-w-2xl">
          <h2 class="text-[clamp(1.5rem,4vw,2.2rem)] font-semibold tracking-[-0.02em] text-moss-100">
            Services behind the dashboard
          </h2>
          <p class="mt-3 leading-relaxed text-ink-200">
            RepoDoctor never talks to internal systems from the browser. Everything routes through the gateway
            so you get one secure surface for every diagnostic signal.
          </p>
        </div>
        <div class="border-t border-ink-400">
          @for (service of services; track service.name; let i = $index) {
            <article
              class="grid gap-3 border-b border-ink-400 py-6 animate-home-rise sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-8 sm:py-7"
              [style.animation-delay.ms]="50 + i * 70"
            >
              <p class="font-mono text-xs tracking-[0.14em] text-moss-400 uppercase">{{ service.name }}</p>
              <div>
                <h3 class="text-lg font-semibold tracking-tight text-moss-100">{{ service.title }}</h3>
                <p class="mt-2 max-w-2xl leading-relaxed text-ink-200">{{ service.description }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <footer class="flex flex-col gap-4 border-t border-ink-400 px-4 py-6 text-sm text-ink-200 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-12">
        <span>RepoDoctor · diagnose early, ship confidently</span>
        <a mat-stroked-button routerLink="/login">Log in</a>
      </footer>
    </div>
  `,
})
export class HomePage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    void this.auth.whenReady().then(() => {
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
