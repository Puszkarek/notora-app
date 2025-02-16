import { IconComponent } from '@www/app/primitives/icon';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header-mobile',
  styleUrls: ['./header-mobile.component.scss'],
  templateUrl: './header-mobile.component.html',
  imports: [CommonModule, RouterModule, IconComponent],
})
export class HeaderMobileComponent {
  @Input({ required: true }) public isSideBarOpen = false;
  @Output() public sidebarToggle = new EventEmitter();

  public toggleSideBar(): void {
    this.sidebarToggle.emit();
  }
}
