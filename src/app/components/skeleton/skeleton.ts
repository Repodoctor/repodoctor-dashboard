import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'rd-skeleton inline-block align-middle',
    '[style.height]': 'height()',
    '[style.width]': 'width()',
  },
  template: '',
})
export class SkeletonComponent {
  readonly height = input('0.75rem');
  readonly width = input('100%');
}
