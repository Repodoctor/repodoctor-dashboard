import { Directive, TemplateRef, input } from '@angular/core';

@Directive({
  selector: 'ng-template[appDataTableCell]',
})
export class DataTableCellDirective {
  readonly appDataTableCell = input.required<string>();

  constructor(readonly template: TemplateRef<unknown>) {}
}
