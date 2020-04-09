import { Context as request } from 'grest/src/app/Context/Context';

import { Provider, SyncData, Status } from '../';

export class Github implements Provider {
  private static GIST_API_URL = 'https://api.github.com/gists';

  private gistId: string;
  private userToken: string;

  constructor(gistId: string, userToken: string) {
    this.gistId = gistId;
    this.userToken = userToken;
  }

  async upload(syncData: SyncData): Promise<Status> {
    const { status } = await request.fetch(`${Github.GIST_API_URL}/${this.gistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Authorization: `token ${this.userToken}`,
      },
      body: {
        description: 'Extensions Sync',
        files: {
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
        Authorization: `token ${this.userToken}`,
      },
      method: 'GET',
    });

    return {
      extensions: JSON.parse(body.files.extensions.content),
    };
  }

  getName(): string {
    return 'Github';
  }
}
