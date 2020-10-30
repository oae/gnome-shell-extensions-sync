import { SyncData } from '@esync/data';
import { Context as request } from 'grest/src/app/Context/Context';
import { SyncOperationStatus, SyncProvider } from '../types';

export class Gitlab implements SyncProvider {
  private static SNIPPETS_API_URL = 'https://gitlab.com/api/v4/snippets';

  private snippetId: string;
  private userToken: string;

  constructor(snippetId: string, userToken: string) {
    this.snippetId = snippetId;
    this.userToken = userToken;
  }

  async save(syncData: SyncData): Promise<SyncOperationStatus> {
    const { status } = await request.fetch(`${Gitlab.SNIPPETS_API_URL}/${this.snippetId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'PRIVATE-TOKEN': `${this.userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: 'Extensions Sync',
        content: JSON.stringify(syncData),
      },
      method: 'PUT',
    });

    if (status !== 200) {
      throw new Error(`failed to save data to ${this.getName()}. Server status: ${status}`);
    }

    return status === 200 ? SyncOperationStatus.SUCCESS : SyncOperationStatus.FAIL;
  }

  async read(): Promise<SyncData> {
    const { body, status } = await request.fetch(`${Gitlab.SNIPPETS_API_URL}/${this.snippetId}/raw`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'PRIVATE-TOKEN': `${this.userToken}`,
      },
      method: 'GET',
    });

    if (status !== 200) {
      throw new Error(`failed to read data from ${this.getName()}. Server status: ${status}`);
    }

    return body;
  }

  getName(): string {
    return 'Gitlab';
  }
}
