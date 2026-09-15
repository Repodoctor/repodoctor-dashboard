import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { WorkspaceStore } from '../../../stores/workspace.store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../stores/auth.store';
import { ToastService } from '../../../services/toast.service';
import { errorMessage, isHttpError } from '../../../utils/error-message';
import { passwordRules, passwordsMatch } from '../../../utils/password-strength';
import type { Workspace } from '../../../interfaces/api';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';
import { DataTableComponent } from '../../../components/data-table/data-table';
import { AvatarComponent } from '../../../components/avatar/avatar';
import { LoadingButtonComponent } from '../../../components/loading-button/loading-button';
import { PageHeaderComponent } from '../../../components/page-header/page-header';
import { PasswordFieldsComponent } from '../../../components/password-fields/password-fields';
import { workspaceColumns } from '../../../utils/data-table-columns';

@Component({
  selector: 'app-settings-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    DataTableComponent,
    AvatarComponent,
    LoadingButtonComponent,
    PageHeaderComponent,
    PasswordFieldsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
})
export class SettingsPage {
  readonly auth = inject(AuthStore);
  private readonly workspaceStore = inject(WorkspaceStore);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly workspaces = signal<Workspace[]>([]);
  readonly orgColumns = workspaceColumns();
  readonly saving = signal(false);
  readonly savingPassword = signal(false);
  readonly deleting = signal(false);
  readonly changingPassword = signal(false);
  readonly profileForm = this.fb.nonNullable.group({
    displayName: [this.auth.user()?.displayName ?? '', [Validators.required, Validators.minLength(1)]],
  });
  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      password: ['', [Validators.required, passwordRules()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  readonly ownedOrgs = () => this.workspaces().filter((item) => item.role === 'OWNER');
  readonly ownedNames = () => this.ownedOrgs().map((item) => item.name).join(', ');

  constructor() {
    void this.load();
  }

  openOrgSettings(org: Workspace): void {
    void this.router.navigate(['/workspaces', org.id]);
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    try {
      await this.auth.updateProfile(this.profileForm.getRawValue().displayName);
      this.toast.show('Profile updated.', 'success');
    } catch {
      // HTTP errors are toasted by the interceptor.
    } finally {
      this.saving.set(false);
    }
  }

  cancelPasswordChange(): void {
    this.changingPassword.set(false);
    this.passwordForm.reset({ currentPassword: '', password: '', confirmPassword: '' });
  }

  async savePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    try {
      const { currentPassword, password } = this.passwordForm.getRawValue();
      await this.auth.changePassword(currentPassword, password);
      this.toast.show('Password updated.', 'success');
      this.cancelPasswordChange();
    } catch (error) {
      if (!isHttpError(error)) {
        this.toast.show(errorMessage(error, 'Unable to update password. Check your current password.'), 'error');
      }
    } finally {
      this.savingPassword.set(false);
    }
  }

  async askDeleteAccount(): Promise<void> {
    const email = this.auth.user()?.email;
    if (!email) return;
    const owned = this.ownedNames();
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Delete my account',
            body:
              `This permanently deletes your RepoDoctor account and signs you out.` +
              (owned
                ? ` Owned workspaces that will also be deleted: ${owned}.`
                : ' Workspaces you do not own stay; you are removed from them.') +
              ' Type your email to confirm. This cannot be undone.',
            confirm: 'Delete my account',
            typedValueLabel: 'Type your email to confirm',
            typedValueToMatch: email,
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.deleting.set(true);
    try {
      await this.auth.deleteAccount();
    } catch {
      this.deleting.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.workspaces.set(await this.workspaceStore.listAll());
    } catch {
      // HTTP errors are toasted by the interceptor.
    }
  }
}
