import { IconComponent } from '@www/app/components/icon';
import { TooltipDirective } from '@www/app/directives/tooltip';
import { ICON_ID } from '@www/app/interfaces/icon';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { isNotNull } from '@utils';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs';
import { AuthService } from '@www/app/services/auth';

type NavBarAction = {
  label: string;
  icon: ICON_ID;
  route: string;
  color?: string;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-nav-bar',
  styleUrls: ['./nav-bar.component.scss'],
  templateUrl: './nav-bar.component.html',
  imports: [CommonModule, RouterModule, IconComponent, TooltipDirective],
})
export class NavBarComponent {
  public readonly mainActions$ = this._authService.loggedUser$.pipe(
    filter(isNotNull),
    distinctUntilChanged(),
    map(() => {
      const actions: Array<NavBarAction> = [
        {
          label: 'Início',
          icon: 'house',
          route: '/',
        },
      ];

      return actions;
    }),
    shareReplay({
      refCount: true,
      bufferSize: 1,
    }),
  );

  public readonly footerActions$ = this._authService.loggedUser$.pipe(
    filter(isNotNull),
    distinctUntilChanged(),
    map(() => {
      const actions: Array<NavBarAction> = [
        {
          label: 'Minha Conta',
          icon: 'person',
          route: '/settings',
        },

        /* Logout */
        {
          label: 'Sair',
          icon: 'box-arrow-left',
          color: '#f44336',
          route: '/logout',
        },
      ];

      return actions;
    }),
    shareReplay({
      refCount: true,
      bufferSize: 1,
    }),
  );

  @Output() public readonly logout = new EventEmitter();

  @HostBinding('class.mobile') @Input({ required: true }) public useMobileStyles = false;
  @HostBinding('class.opened') @Input({ required: true }) public isOpened = false;

  @Output() public readonly sidebarToggle = new EventEmitter();

  constructor(private readonly _authService: AuthService) {}

  public toggleSidebar(): void {
    this.sidebarToggle.emit();
  }
}
