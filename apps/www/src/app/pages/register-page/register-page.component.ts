import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { ActionDirective } from '@www/app/directives/action.directive';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { getGoogleConsentURL } from '@www/app/helpers/get-google-consent-url';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register-page',
  styleUrls: ['./register-page.component.scss'],
  templateUrl: './register-page.component.html',
  imports: [RouterModule, IconComponent, ActionDirective, PageContainerComponent],
})
export class RegisterPageComponent {
  public readonly getGoogleConsentURL = getGoogleConsentURL();
  constructor() {}
}
