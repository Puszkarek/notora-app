import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@www/app/primitives/icon/icon.component';
import { ActionDirective } from '@www/app/directives/action.directive';
import { getGoogleConsentURL } from '@www/app/helpers/get-google-consent-url';
import { PageContainerComponent } from '../../primitives/page-container/page-container.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html',
  imports: [RouterModule, IconComponent, ActionDirective, PageContainerComponent],
})
export class LoginPageComponent {
  public readonly getGoogleConsentURL = getGoogleConsentURL();
}
