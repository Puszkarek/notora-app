import { NotificationToastComponent } from '@www/app/primitives/notification-toast/notification-toast.component';
import { NOTIFICATION_DATA_TOKEN } from '@www/app/constants/notification';
import { NotificationType } from '@www/app/interfaces/notification';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, ViewContainerRef } from '@angular/core';
import * as E from 'fp-ts/es6/Either';
import { firstValueFrom, race, Subject, timer } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _viewContainerReference: ViewContainerRef | null = null;

  private readonly _closeCurrent$ = new Subject<void>();

  private _currentOverlayReference: OverlayRef | null = null;

  constructor(private readonly _overlay: Overlay) {}

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
   * Show a notification to the user when an action works perfectly
   *
   * @param message - The message to show in the notification
   */
  public async success(message: string): Promise<void> {
    await this._instantiateNotification('success', message);
  }

  /**
   * Show a notification to the user when an action is loading
   *
   * @param message - The message to show in the notification
   */
  public async loading(): Promise<void> {
    await this._instantiateNotification('loading');
  }

  /**
   * Show a notification to the user when an action fails
   *
   * @param message - The message to show in the notification
   */
  public async error(message: string): Promise<void> {
    await this._instantiateNotification('error', message);
  }

  /**
   * Show a notification to the user to warn about something
   *
   * @param message - The message to show in the notification
   */
  public async warn(message: string): Promise<void> {
    await this._instantiateNotification('warn', message);
  }

  /**
   * Show a notification to the user that needs to be aware of something that happens
   *
   * @param message - The message to show in the notification
   */
  public async info(message: string): Promise<void> {
    await this._instantiateNotification('info', message);
  }

  public async notifyBasedOnEither(
    either: E.Either<unknown, unknown>,
    errorMessage: string,
    successMessage: string,
  ): Promise<void> {
    if (E.isLeft(either)) {
      await this.error(errorMessage);
      return;
    }

    await this.success(successMessage);
  }

  /**
   * Create a new Component to show the notification, then wait for a specific duration and
   * destroy it
   */
  private async _instantiateNotification(type: NotificationType, message?: string): Promise<void> {
    if (!this._viewContainerReference) {
      return;
    }

    this._closeCurrent$.next();
    // Instantiate the necessary data for the notification

    // * Initialize overlay
    const overlayConfig = this._getOverlayConfig();
    const overlayReference = this._overlay.create(overlayConfig);
    this._currentOverlayReference = overlayReference;

    // * Create component portal
    const injector = Injector.create({
      providers: [
        {
          provide: NOTIFICATION_DATA_TOKEN,
          useValue: { message, type },
        },
      ],
    });
    const containerPortal = new ComponentPortal(NotificationToastComponent, this._viewContainerReference, injector);

    // * Attach to the view
    overlayReference.attach(containerPortal);

    // Wait a time that the user can read it
    const NOTIFICATION_DURATION = type === 'loading' ? 100_000 : 2000;

    const timer$ = race([timer(NOTIFICATION_DURATION), this._closeCurrent$]);
    await firstValueFrom(timer$);

    // Then destroy the notification component
    overlayReference.detach();
  }

  public clean(): void {
    if (this._currentOverlayReference) {
      this._currentOverlayReference.detach();
    }
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
      scrollStrategy: this._overlay.scrollStrategies.noop(),
      positionStrategy: this._overlay.position().global().top().right(),
    });
  }
}
