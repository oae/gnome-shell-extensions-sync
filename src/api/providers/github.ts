import { Context as request } from 'grest/src/app/Context/Context';

import { Provider, SyncData, Status } from '../';

export class Github implements Provider {
  private static GIST_API_URL = 'https://api.github.com/gists';
  private gistId: string;
  private gistToken: string;

  constructor(gistId: string, gistToken: string) {
    this.gistId = gistId;
    this.gistToken = gistToken;
  }

  async upload(syncData: SyncData): Promise<Status> {
    const { status } = await request.fetch(`${Github.GIST_API_URL}/${this.gistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Authorization: `token ${this.gistToken}`,
      },
      body: {
        description: 'Extensions Sync',
        files: {
          syncSettings: {
            content: JSON.stringify(syncData.syncSettings),
          },
          extensions: {
            content: JSON.stringify(syncData.extensions),
          },
        },
      },
      method: 'PATCH',
    });

    return status === 200 ? Status.SUCCESS : Status.FAIL;
  }

  async download(): Promise<SyncData> {
    const { body } = await request.fetch(`${Github.GIST_API_URL}/${this.gistId}`, {
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
