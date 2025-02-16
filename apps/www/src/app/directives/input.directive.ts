import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appInput]',

  standalone: true,
})
export class InputDirective {
  constructor(private readonly _elementReference: ElementRef<HTMLElement>) {
    // * Add class to the input
    this._elementReference.nativeElement.classList.add('custom-input');
  }
}
