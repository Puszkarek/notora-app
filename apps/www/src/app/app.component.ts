import { NotificationService } from '@www/app/services/notification';
import { ScreenService } from '@www/app/services/screen';
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, signal, ViewContainerRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { debounceTime, distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';
import { AuthService } from '@www/app/services/auth';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from '@www/app/primitives/nav-bar';
import { HeaderMobileComponent } from '@www/app/primitives/header-mobile';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavBarComponent, HeaderMobileComponent],
})
export class AppComponent implements AfterViewInit {
  public readonly isMobile = this._screenService.isMobile;

  public readonly isAuthenticated = this._authService.isAuthenticated$;

  private readonly _isSidebarOpened = signal(false);
  public readonly isSidebarOpened = this._isSidebarOpened.asReadonly();

  constructor(
    viewContainerReference: ViewContainerRef,
    private readonly _screenService: ScreenService,
    private readonly _titleService: Title,
    private readonly _authService: AuthService,
    private readonly _destroyReference: DestroyRef,
    private readonly _notificationService: NotificationService,
  ) {
    // Inject the ViewContainer into the notification Service
    this._notificationService.setRootViewContainerRef(viewContainerReference);
  }

  public ngAfterViewInit(): void {
    // eslint-disable-next-line functional/no-let
    let focusedTitle = this._titleService.getTitle();

    fromEvent(window, 'visibilitychange')
      .pipe(
        debounceTime(100),
        startWith(null),
        map(() => document.visibilityState === 'hidden'),
        distinctUntilChanged(),
        map(isUnfocused => {
          if (isUnfocused) {
            focusedTitle = this._titleService.getTitle();
            return '🥺';
          }
          return focusedTitle;
        }),
        takeUntilDestroyed(this._destroyReference),
      )
      .subscribe(title => {
        this._titleService.setTitle(title);
      });
  }

  public toggleSidebar(): void {
    this._isSidebarOpened.update(isOpened => !isOpened);
  }
}
