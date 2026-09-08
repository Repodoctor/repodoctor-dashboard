import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
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
          <input class="rd-input mt-1" formControlName="name" />
        </label>
        <label class="text-sm">Slug (optional)
          <input class="rd-input mt-1" formControlName="slug" />
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
            <div class="rd-card flex items-start justify-between gap-3">
              <a class="min-w-0 flex-1 hover:text-moss-300" [routerLink]="['/organizations', org.id]">
                <p class="font-medium">{{ org.name }}</p>
                <p class="font-mono text-xs text-ink-200">{{ org.slug }} · {{ org.role }}</p>
              </a>
              @if (org.role === 'OWNER') {
                <div class="relative">
                  <button
                    class="rounded-md p-2 text-ink-200 hover:bg-ink-600 hover:text-moss-300"
                    type="button"
                    aria-label="Organization actions"
                    [attr.aria-expanded]="menuId() === org.id"
                    aria-haspopup="menu"
                    (click)="toggleMenu(org.id, $event)"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <circle cx="3" cy="8" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="13" cy="8" r="1.5" />
                    </svg>
                  </button>
                  @if (menuId() === org.id) {
                    <div class="absolute right-0 z-20 mt-1 min-w-36 overflow-hidden rounded-md border border-ink-400 bg-ink-800 py-1 shadow-glow">
                      <button
                        class="block w-full px-3 py-2 text-left text-sm text-red-200 hover:bg-ink-600"
                        type="button"
                        (click)="askDelete(org)"
                      >
                        Delete
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    @if (pendingDelete(); as org) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4" (click)="pendingDelete.set(null)">
        <div class="rd-card w-full max-w-md" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold">Delete organization</h2>
          <p class="mt-2 text-sm text-ink-200">
            Delete <span class="font-medium text-moss-200">{{ org.name }}</span>? This cannot be undone.
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <button class="rd-btn-ghost" type="button" (click)="pendingDelete.set(null)">Cancel</button>
            <button class="rd-btn bg-red-400 hover:bg-red-300" type="button" [disabled]="saving()" (click)="confirmDelete()">
              {{ saving() ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class OrganizationsPage {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly items = signal<Organization[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly menuId = signal<string | null>(null);
  readonly pendingDelete = signal<Organization | null>(null);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
  });

  constructor() {
    void this.refresh();
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuId.set(null);
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.menuId.update((current) => (current === id ? null : id));
  }

  askDelete(org: Organization): void {
    this.menuId.set(null);
    this.pendingDelete.set(org);
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

  async confirmDelete(): Promise<void> {
    const org = this.pendingDelete();
    if (!org) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.auth.deleteOrganization(org.id);
      this.pendingDelete.set(null);
      this.toast.show(`${org.name} was deleted.`, 'success');
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
