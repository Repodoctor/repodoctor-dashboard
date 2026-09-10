import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmDialogData {
  title: string;
  body: string;
  confirm: string;
  typedValueLabel?: string;
  typedValueToMatch?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content class="space-y-4">
      <p class="text-sm text-ink-200">{{ data.body }}</p>
      @if (data.typedValueToMatch) {
        <mat-form-field appearance="outline">
          <mat-label>{{ data.typedValueLabel || 'Type to confirm' }}</mat-label>
          <input matInput [ngModel]="typed()" (ngModelChange)="typed.set($event)" autocomplete="off" />
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button color="warn" type="button" [disabled]="!canConfirm()" (click)="dialogRef.close(true)">
        {{ data.confirm }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  readonly typed = signal('');

  canConfirm(): boolean {
    const expected = this.data.typedValueToMatch;
    if (!expected) return true;
    return this.typed().trim().toLowerCase() === expected.trim().toLowerCase();
  }
}
