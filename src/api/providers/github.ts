import { SyncData } from '@esync/data';
import { logger } from '@esync/utils';
import { Bytes, PRIORITY_DEFAULT } from '@gi-types/glib2';
import { Message, Session, Status, status_get_phrase } from '@gi-types/soup3';
import { SyncOperationStatus, SyncProvider } from '../types';

const debug = logger('github');

export class Github implements SyncProvider {
  private static GIST_API_URL = 'https://api.github.com/gists';

  private gistId: string;
  private userToken: string;
  private session: Session;

  constructor(gistId: string, userToken: string) {
    this.gistId = gistId;
    this.userToken = userToken;
    this.session = new Session();
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

    const message = Message.new('PATCH', `${Github.GIST_API_URL}/${this.gistId}`);
    message.request_headers.append('User-Agent', 'Mozilla/5.0');
    message.request_headers.append('Authorization', `token ${this.userToken}`);
    const requestBody = JSON.stringify({
      description: 'Extensions Sync',
      files,
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
    const message = Message.new('GET', `${Github.GIST_API_URL}/${this.gistId}`);
    message.request_headers.append('User-Agent', 'Mozilla/5.0');
    message.request_headers.append('Authorization', `token ${this.userToken}`);

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
    const body = JSON.parse(json);

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
