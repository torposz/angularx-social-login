import { BaseLoginProvider } from '../entities/base-login-provider';
import { SocialUser } from '../entities/social-user';

declare let amazon: any, window: any;

export class AmazonLoginProvider extends BaseLoginProvider {
  public static readonly PROVIDER_ID: string = 'AMAZON';

  constructor(
    private clientId: string,
    private initOptions: any = {
      scope: 'profile',
      scope_data: {
        profile: { essential: false },
      },
      redirect_uri: location.origin,
    }
  ) {
    super();
  }

  initialize(): Promise<void> {
    let amazonRoot = null;
    if (document) {
      amazonRoot = document.createElement('div');
      amazonRoot.id = 'amazon-root';
      document.body.appendChild(amazonRoot);
    }

    window.onAmazonLoginReady = () => {
      amazon.Login.setClientId(this.clientId);
    };

    return new Promise((resolve, reject) => {
      this.loadScript(
        'amazon-login-sdk',
        'https://assets.loginwithamazon.com/sdk/na/login1.js',
        () => {
          resolve();
        },
        amazonRoot
      );
    });
  }

  getLoginStatus(): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      // TODO: localStorage based implementation?
      amazon.Login.retrieveProfile('', (response) => {
        if (response.success) {
          let user: SocialUser = new SocialUser();

          user.id = response.profile.CustomerId;
          user.name = response.profile.Name;
          user.email = response.profile.PrimaryEmail;

          resolve(user);
        } else {
          reject(response.error);
        }
      });
    });
  }

  signIn(signInOptions?: any): Promise<SocialUser> {
    const options = { ...this.initOptions, ...signInOptions };
    return new Promise((resolve, reject) => {
      amazon.Login.authorize(options, (authResponse) => {
        if (authResponse.error) {
          reject(authResponse.error);
        } else {
          amazon.Login.retrieveProfile(
            authResponse.access_token,
            (response) => {
              let user: SocialUser = new SocialUser();

              user.id = response.profile.CustomerId;
              user.name = response.profile.Name;
              user.email = response.profile.PrimaryEmail;
              user.authToken = authResponse.access_token;

              resolve(user);
            }
          );
        }
      });
    });
  }

  signOut(revoke?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        amazon.Login.logout();
        resolve();
      } catch (err) {
        reject(err.message);
      }
    });
  }
}
