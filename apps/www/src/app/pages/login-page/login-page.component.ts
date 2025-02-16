import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@www/app/primitives/icon';
import { ActionDirective } from '@www/app/directives/action';
import { getGoogleConsentURL } from '@www/app/helpers/get-google-consent-url';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html',
  imports: [RouterModule, IconComponent, ActionDirective],
})
export class LoginPageComponent {
  public readonly getGoogleConsentURL = getGoogleConsentURL();
}
