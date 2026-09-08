import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';
import type { Organization } from '../core/models';

@Component({
  selector: 'app-organizations-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-moss-400">Tenancy</p>
          <h1 class="text-3xl font-semibold">Organizations</h1>
        </div>
      </div>
      <form class="rd-card grid gap-3 md:grid-cols-[1fr_1fr_auto]" [formGroup]="form" (ngSubmit)="create()">
        <label class="text-sm">Name
          <input class="rd-input mt-1" formControlName="name" placeholder="Acme Engineering" />
        </label>
        <label class="text-sm">Slug (optional)
          <input class="rd-input mt-1" formControlName="slug" placeholder="acme-engineering" />
        </label>
        <button class="rd-btn self-end" [disabled]="form.invalid || saving()">Create</button>
      </form>
      @if (error()) {
        <p class="text-sm text-red-200">{{ error() }}</p>
      }
      @if (loading()) {
        <p class="text-ink-200">Loading…</p>
      } @else if (items().length === 0) {
        <div class="rd-card text-ink-200">No organizations yet. Create one to become OWNER.</div>
      } @else {
        <div class="grid gap-3">
          @for (org of items(); track org.id) {
            <a class="rd-card block hover:border-moss-400" [routerLink]="['/organizations', org.id]">
              <p class="font-medium">{{ org.name }}</p>
              <p class="font-mono text-xs text-ink-200">{{ org.slug }} · {{ org.role }}</p>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class OrganizationsPage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly items = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
  });

  constructor() {
    void this.refresh();
  }

  async create(): Promise<void> {
    this.error.set(null);
    this.saving.set(true);
    try {
      const { name, slug } = this.form.getRawValue();
      await this.auth.createOrganization({ name, slug: slug || undefined });
      this.form.reset({ name: '', slug: '' });
      await this.refresh();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.auth.listOrganizations());
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
