import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[appDataTableMobile]',
})
export class DataTableMobileDirective {
  constructor(readonly template: TemplateRef<unknown>) {}
}
