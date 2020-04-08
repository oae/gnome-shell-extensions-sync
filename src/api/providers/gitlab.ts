import { Context as request } from 'grest/src/app/Context/Context';

import { Provider, SyncData, Status } from '../';
import { setTimeout } from '../../utils';

export class Gitlab implements Provider {
  private snippetId: string;
  private snippetToken: string;
  private apiUrl: string;

  constructor(snippetId: string, snippetToken: string, apiUrl?: string) {
    this.snippetId = snippetId;
    this.snippetToken = snippetToken;
    this.apiUrl = 'https://gitlab.com/api/v4/snippets';
    if (apiUrl !== undefined) {
      this.apiUrl = apiUrl;
    }
  }

  async upload(syncData: SyncData): Promise<Status> {
    log(`uploading ${JSON.stringify(syncData, null, 2)}`);
    return new Promise((resolve) => setTimeout(resolve, 3000));
  }

  async download(): Promise<SyncData> {
    const { body } = await request.fetch(`${this.apiUrl}/${this.snippetId}/raw`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'PRIVATE-TOKEN': `${this.snippetToken}`,
      },
      method: 'GET',
    });

    log(JSON.stringify(body));

    return {
      extensions: JSON.parse(JSON.stringify(body)),
    };
  }

  getName(): string {
    return 'Gitlab';
  }
}
