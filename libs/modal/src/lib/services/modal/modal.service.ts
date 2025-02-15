import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DestroyRef, Injectable, Injector, Type, ViewContainerRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MODAL_DATA_TOKEN } from '@modal/constants/modal';
import { ModalReference } from '@modal/services/modal-reference';
import { Observable, Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  /** It's initialize in the `AppComponent` initialization */
  private _viewContainerReference!: ViewContainerRef;

  constructor(
    private readonly _overlay: Overlay,
    private readonly _destroyReference: DestroyRef,
  ) {}

  /**
   * We need that because we can't inject `setRootViewContainerRef` directly inside a service,
   * so we are injecting inside the `app.component` and calling this function to pass the
   * service here
   *
   * @param viewContainerReference - The `ViewContainerRef` to use for instantiate modals
   */
  public setRootViewContainerRef(viewContainerReference: ViewContainerRef): void {
    this._viewContainerReference = viewContainerReference;
  }

  /**
   * Will instantiate a component modal and attach to the view
   *
   * @param component - The component to use as a modal
   * @param data - The optional data to inject inside modal
   * @returns A subscription that will emit after the the close action be triggered
   */
  public open<ModalOutputData, ModalInputData>(
    component: Type<unknown>,
    data?: ModalInputData,
    options?: {
      /* Default is `true` */
      readonly closeOnBackdropClick?: boolean;
    },
  ): {
    readonly data$: Observable<ModalOutputData | null>;
  } {
    const destroy$ = new Subject<void>();
    // * Initialize overlay
    const overlayConfig = this._getOverlayConfig();
    const overlayReference = this._overlay.create(overlayConfig);

    // * Inject the required data
    const modalReference = new ModalReference<ModalOutputData | null>();
    const injector = Injector.create({
      providers: [
        {
          provide: MODAL_DATA_TOKEN,
          useValue: data,
        },
        {
          provide: ModalReference,
          useValue: modalReference,
        },
      ],
    });

    // * Create component portal

    const containerPortal = new ComponentPortal(component, this._viewContainerReference, injector);

    // * Attach to the view
    const reference = overlayReference.attach(containerPortal);

    modalReference.close$
      .pipe(takeUntil(overlayReference.backdropClick()), takeUntilDestroyed(this._destroyReference))
      .subscribe(() => destroy$.next());

    if (options?.closeOnBackdropClick ?? true) {
      overlayReference
        .backdropClick()
        .pipe(takeUntil(modalReference.close$), takeUntilDestroyed(this._destroyReference))
        .subscribe(() => {
          modalReference.close(null);
          destroy$.next();
        });
    }

    // * Listen to backdrop clicks to close
    destroy$.pipe(first(), takeUntilDestroyed(this._destroyReference)).subscribe({
      complete: () => {
        reference.destroy();
        overlayReference.detach();
        overlayReference.dispose();
      },
    });

    // * Returns the data
    return {
      data$: modalReference.close$,
    };
  }

  /**
   * Init a `OverlayConfig` with default options
   *
   * @returns A standalone config for overlay
   */
  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      // * Setup
      hasBackdrop: true,
      disposeOnNavigation: false,

      // * Custom CSS classes
      backdropClass: 'modal-backdrop',
      panelClass: 'modal-panel',

      // * Strategy
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
    });
  }
}
