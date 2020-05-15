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
    const files = Object.keys(syncData).reduce((acc, key) => {
      return {
        ...acc,
        [key]: {
          content: JSON.stringify(syncData[key]),
        },
      };
    }, {});

    const { status } = await request.fetch(`${Github.GIST_API_URL}/${this.gistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Authorization: `token ${this.userToken}`,
      },
      body: {
        description: 'Extensions Sync',
        files,
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

    const syncData: SyncData = Object.keys(body.files).reduce(
      (acc, key) => {
        return {
          ...acc,
          [key]: JSON.parse(body.files[key].content),
        };
      },
      {
        extensions: {},
      },
    );

    return syncData;
  }

  getName(): string {
    return 'Github';
  }
}
