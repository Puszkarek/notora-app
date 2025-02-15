import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appAction]',
  standalone: true,
})
export class ActionDirective {
  @Input('appAction') public set styleType(
    type: 'primary' | 'secondary' | 'icon-primary' | 'icon-secondary' | 'outlined',
  ) {
    this._elementReference.nativeElement.classList.add(`action-${type}`);
  }

  @Input() public set shadow(value: boolean) {
    if (value) {
      this._elementReference.nativeElement.classList.add('action-shadow');
    }
  }

  constructor(private readonly _elementReference: ElementRef<HTMLElement>) {
    // * Add class to the input
    this._elementReference.nativeElement.classList.add('action');
  }
}
