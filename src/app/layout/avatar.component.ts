import { Component, computed, input } from '@angular/core';
import { userInitials } from '../core/user-initials';

@Component({
  selector: 'app-avatar',
  template: `
    @if (url()) {
      <img [class]="imageClass()" [src]="url()" alt="" />
    } @else {
      <span [class]="fallbackClass()">
        {{ initials() }}
      </span>
    }
  `,
})
export class AvatarComponent {
  readonly url = input<string | undefined | null>(null);
  readonly name = input<string | undefined | null>('');
  readonly email = input<string | undefined | null>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() => userInitials({ displayName: this.name() ?? '', email: this.email() ?? '' }));
  readonly sizeClass = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 'h-8 w-8 text-xs';
      case 'lg':
        return 'h-16 w-16 text-lg';
      default:
        return 'h-9 w-9 text-sm';
    }
  });
  readonly imageClass = computed(() => `${this.sizeClass()} rounded-full object-cover`);
  readonly fallbackClass = computed(
    () => `${this.sizeClass()} flex items-center justify-center rounded-full bg-pulse font-semibold text-ink`,
  );
}
