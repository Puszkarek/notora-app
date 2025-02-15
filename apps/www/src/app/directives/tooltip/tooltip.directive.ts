import { TooltipComponent } from '@www/app/components/tooltip';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DestroyRef, Directive, HostListener, Injector, Input, ViewContainerRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { first, fromEvent, race, Subject } from 'rxjs';

import { TOOLTIP_DATA_TOKEN } from '../../constants/tooltip';
@Directive({
  selector: '[appTooltip]',

  standalone: true,
})
export class TooltipDirective {
  @Input({
    alias: 'appTooltip',
    required: true,
  })
  public message = '';

  private readonly _mouseLeave$ = new Subject<void>();

  private readonly _wheel$ = fromEvent(window, 'wheel').pipe(takeUntilDestroyed(this._destroyReference));

  constructor(
    private readonly _destroyReference: DestroyRef,
    private readonly _viewContainerReference: ViewContainerRef,
    private readonly _overlay: Overlay,
  ) {}

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    // * Initialize overlay
    const overlayConfig = this._getOverlayConfig();
    const overlayReference = this._overlay.create(overlayConfig);

    // * Create component portal
    const injector = Injector.create({
      providers: [
        {
          provide: TOOLTIP_DATA_TOKEN,
          useValue: { message: this.message },
        },
      ],
    });
    const containerPortal = new ComponentPortal(TooltipComponent, this._viewContainerReference, injector);

    // * Attach to the view
    overlayReference.attach(containerPortal);

    // Then wait for the mouse leave event to detach the overlay
    race([this._wheel$, this._mouseLeave$])
      .pipe(first(), takeUntilDestroyed(this._destroyReference))
      .subscribe({
        complete: () => {
          overlayReference.detach();
          overlayReference.dispose();
        },
      });
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this._mouseLeave$.next();
  }

  /**
   * Init a `OverlayConfig` with default options
   *
   * @returns A standalone config for overlay
   */
  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      // * Setup
      hasBackdrop: false,
      disposeOnNavigation: true,

      // * Strategy
      scrollStrategy: this._overlay.scrollStrategies.close(),
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this._viewContainerReference.element)
        .withPositions([
          {
            originX: 'center',
            originY: 'bottom',
            overlayX: 'center',
            overlayY: 'top',
            offsetY: 8,
          },
        ]),
    });
  }
}
