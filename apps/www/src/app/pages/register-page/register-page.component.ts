import { IconComponent } from '@www/app/primitives/icon';
import { ActionDirective } from '@www/app/directives/action';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { getGoogleConsentURL } from '@www/app/helpers/get-google-consent-url';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register-page',
  styleUrls: ['./register-page.component.scss'],
  templateUrl: './register-page.component.html',
  imports: [RouterModule, IconComponent, ActionDirective],
})
export class RegisterPageComponent {
  public readonly getGoogleConsentURL = getGoogleConsentURL();
  constructor() {}
}
