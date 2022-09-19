import { SyncData } from '@esync/data';
import { Bytes, PRIORITY_DEFAULT } from '@gi-types/glib2';
import { Message, Session, Status, status_get_phrase } from '@gi-types/soup3';
import { SyncOperationStatus, SyncProvider } from '../types';

export class Gitlab implements SyncProvider {
  private static SNIPPETS_API_URL = 'https://gitlab.com/api/v4/snippets';

  private snippetId: string;
  private userToken: string;
  private session: Session;

  constructor(snippetId: string, userToken: string) {
    this.snippetId = snippetId;
    this.userToken = userToken;
    this.session = new Session();
  }

  async save(syncData: SyncData): Promise<SyncOperationStatus> {
    const message = Message.new('PUT', `${Gitlab.SNIPPETS_API_URL}/${this.snippetId}`);
    message.request_headers.append('User-Agent', 'Mozilla/5.0');
    message.request_headers.append('PRIVATE-TOKEN', `${this.userToken}`);
    const requestBody = JSON.stringify({
      title: 'Extensions Sync',
      content: JSON.stringify(syncData),
    });
    message.set_request_body_from_bytes('application/json', new Bytes(imports.byteArray.fromString(requestBody)));
    await this.session.send_and_read_async(message, PRIORITY_DEFAULT, null);

    const { statusCode } = message;
    const phrase = status_get_phrase(statusCode);
    if (statusCode !== Status.OK) {
      throw new Error(`failed to save data to ${this.getName()}. Server status: ${phrase}`);
    }

    return SyncOperationStatus.SUCCESS;
  }

  async read(): Promise<SyncData> {
    const message = Message.new('GET', `${Gitlab.SNIPPETS_API_URL}/${this.snippetId}/raw`);
    message.request_headers.append('User-Agent', 'Mozilla/5.0');
    message.request_headers.append('PRIVATE-TOKEN', `${this.userToken}`);

    const bytes = await this.session.send_and_read_async(message, PRIORITY_DEFAULT, null);
    const { statusCode } = message;
    const phrase = status_get_phrase(statusCode);
    if (statusCode !== Status.OK) {
      throw new Error(`failed to read data from ${this.getName()}. Server status: ${phrase}`);
    }

    const data = bytes.get_data();
    if (data === null) {
      throw new Error(`failed to read data from ${this.getName()}. Empty response`);
    }

    const json = imports.byteArray.toString(data);
    const syncData = JSON.parse(json);

    return syncData;
  }

  getName(): string {
    return 'Gitlab';
  }
}
