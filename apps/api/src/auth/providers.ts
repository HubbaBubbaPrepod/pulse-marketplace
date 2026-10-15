import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as oidc from 'openid-client';
import { CONFIG, type Config } from '../config.js';
export interface FlowState {
  state: string;
  verifier: string;
  nonce: string;
}
export interface Identity {
  id: string;
  displayName: string;
}
@Injectable()
export class Providers {
  private google?: Promise<oidc.Configuration>;
  constructor(@Inject(CONFIG) private readonly config: Config) {}
  available(provider: string) {
    return (
      ['github', 'google'].includes(provider) &&
      Boolean(
        process.env[`${provider.toUpperCase()}_CLIENT_ID`] &&
        process.env[`${provider.toUpperCase()}_CLIENT_SECRET`],
      )
    );
  }
  private googleConfig() {
    if (!this.google)
      this.google = oidc
        .discovery(
          new URL('https://accounts.google.com'),
          process.env.GOOGLE_CLIENT_ID!,
          process.env.GOOGLE_CLIENT_SECRET!,
        )
        .catch((error) => {
          this.google = undefined;
          throw error;
        });
    return this.google;
  }
  private callback(provider: string) {
    return `${this.config.origin}/api/v1/auth/${provider}/callback/`;
  }
  async authorization(provider: string, flow: FlowState): Promise<string> {
    if (!this.available(provider)) throw new ServiceUnavailableException('Provider unavailable');
    const challenge = await oidc.calculatePKCECodeChallenge(flow.verifier);
    const parameters = {
      redirect_uri: this.callback(provider),
      response_type: 'code',
      state: flow.state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    };
    if (provider === 'google')
      return oidc.buildAuthorizationUrl(await this.googleConfig(), {
        ...parameters,
        scope: 'openid profile',
        nonce: flow.nonce,
      }).href;
    const url = new URL('https://github.com/login/oauth/authorize');
    url.search = new URLSearchParams({
      ...parameters,
      client_id: process.env.GITHUB_CLIENT_ID!,
      scope: 'read:user',
    }).toString();
    return url.href;
  }
  async identity(provider: string, url: URL, flow: FlowState): Promise<Identity> {
    if (!this.available(provider)) throw new ServiceUnavailableException('Provider unavailable');
    if (provider === 'google') {
      const tokens = await oidc.authorizationCodeGrant(await this.googleConfig(), url, {
        expectedState: flow.state,
        expectedNonce: flow.nonce,
        pkceCodeVerifier: flow.verifier,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (!claims?.sub) throw new Error('Invalid provider identity');
      return {
        id: claims.sub,
        displayName: typeof claims.name === 'string' ? claims.name : 'Google user',
      };
    }
    const code = url.searchParams.get('code');
    if (!code || code.length > 1024) throw new Error('Invalid authorization code');
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: this.callback(provider),
        code_verifier: flow.verifier,
      }),
    });
    if (!response.ok) throw new Error('Provider exchange failed');
    const token = (await response.json()) as { access_token?: string; token_type?: string };
    if (!token.access_token || token.token_type?.toLowerCase() !== 'bearer')
      throw new Error('Invalid provider response');
    const profile = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'PulseMarketplace/0.1',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!profile.ok) throw new Error('Provider profile failed');
    const user = (await profile.json()) as { id: unknown; name?: string; login?: string };
    if (
      !/^\d+$/.test(String(user.id)) ||
      (typeof user.id === 'number' && !Number.isSafeInteger(user.id))
    )
      throw new Error('Invalid provider identity');
    return { id: String(user.id), displayName: user.name || user.login || 'GitHub user' };
  }
}
