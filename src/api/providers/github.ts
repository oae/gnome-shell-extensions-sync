import { SyncData } from '@esync/data';
import { logger } from '@esync/utils';
import { Context as request } from 'grest/src/app/Context/Context';
import { SyncOperationStatus, SyncProvider } from '../types';

const debug = logger('github');

export class Github implements SyncProvider {
  private static GIST_API_URL = 'https://api.github.com/gists';

  private gistId: string;
  private userToken: string;

  constructor(gistId: string, userToken: string) {
    this.gistId = gistId;
    this.userToken = userToken;
  }

  async save(syncData: SyncData): Promise<SyncOperationStatus> {
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

    if (status !== 200) {
      throw new Error(`failed to save data to ${this.getName()}. Server status: ${status}`);
    }

    return status === 200 ? SyncOperationStatus.SUCCESS : SyncOperationStatus.FAIL;
  }

  async read(): Promise<SyncData> {
    const { body, status } = await request.fetch(`${Github.GIST_API_URL}/${this.gistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Authorization: `token ${this.userToken}`,
      },
      method: 'GET',
    });

    if (status !== 200) {
      throw new Error(`failed to read data from ${this.getName()}. Server status: ${status}`);
    }

    const syncData: SyncData = Object.keys(body.files).reduce(
      (acc, key) => {
        try {
          return {
            ...acc,
            [key]: JSON.parse(body.files[key].content),
          };
        } catch {
          debug(`failed to parse ${key} file. skipping it...`);
          return acc;
        }
      },
      { extensions: {}, keybindings: {}, tweaks: {} },
    );

    return syncData;
  }

  getName(): string {
    return 'Github';
  }
}
