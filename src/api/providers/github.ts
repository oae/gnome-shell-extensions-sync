import { Context as request } from 'grest/src/app/Context/Context';

import { Provider, Result } from '../';
import { setTimeout } from '../../utils';

export class Github implements Provider {
  private static GIST_URL = 'https://api.github.com/gists';
  private gistId: string;
  private gistToken: string;

  constructor(gistId, gistToken) {
    this.gistId = gistId;
    this.gistToken = gistToken;
  }

  async upload(): Promise<Result> {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  }

  async download(): Promise<Result> {
    const { body } = await request.fetch(`${Github.GIST_URL}/${this.gistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Authorization: `token ${this.gistToken}`,
      },
      method: 'GET',
    });

    return {
      syncSettings: JSON.parse(body.files.syncSettings.content),
      extensions: JSON.parse(body.files.extensions.content),
    };
  }

  getName(): string {
    return 'Github';
  }
}
