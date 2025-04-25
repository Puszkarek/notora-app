import { Directive, ElementRef, effect, input } from '@angular/core';

@Directive({
  selector: '[appAction]',
  standalone: true,
})
export class ActionDirective {
  public readonly styleType = input.required<
    'primary' | 'secondary' | 'icon-primary' | 'icon-secondary' | 'destructive' | 'outlined'
  >({
    alias: 'appAction',
  });

  public readonly shadow = input<boolean>(false);

  public readonly isLoading = input<boolean>(false);

  constructor(private readonly _elementReference: ElementRef<HTMLElement>) {
    // * Add class to the input
    this._elementReference.nativeElement.classList.add('action');

    // * Handle type
    let oldStyleType: string | null = null;
    effect(() => {
      // Remove old style
      if (oldStyleType) {
        this._elementReference.nativeElement.classList.remove(`action-${oldStyleType}`);
      }
      // Add new style
      const newStyle = this.styleType();
      this._elementReference.nativeElement.classList.add(`action-${newStyle}`);
      oldStyleType = newStyle;
    });

    // * Handle shadow
    effect(() => {
      // Remove old style
      if (this.shadow()) {
        this._elementReference.nativeElement.classList.add('action-shadow');
      } else {
        this._elementReference.nativeElement.classList.remove('action-shadow');
      }
    });

    // * Handle loading
    effect(() => {
      // Remove old style
      if (this.isLoading()) {
        this._elementReference.nativeElement.classList.add('action-loading');
      } else {
        this._elementReference.nativeElement.classList.remove('action-loading');
      }
    });
  }
}
