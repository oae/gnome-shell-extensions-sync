import { EventEmitter } from 'events';
import { Github } from './providers/github';

export enum Status {
  SUCCESS,
  FAIL,
}

export enum ApiEvents {
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
}

export class Result {
  status?: Status;
  response: any;
}

export interface Provider {
  upload(): Promise<Result>;
  download(): Promise<Result>;
  getName(): string;
}

export class Api {
  private provider: Provider;
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    // We use github as a provider for now.
    this.provider = new Github();
    this.eventEmitter = eventEmitter;
  }

  async upload(): Promise<void> {
    const result: Result = await this.provider.upload();
    this.eventEmitter.emit(ApiEvents.UPLOAD, result);
  }

  async download(): Promise<void> {
    const result: Result = await this.provider.download();
    this.eventEmitter.emit(ApiEvents.DOWNLOAD, result);
  }

  getName(): string {
    return this.provider.getName();
  }
}
