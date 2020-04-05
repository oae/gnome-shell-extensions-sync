import { EventEmitter } from 'events';
import { Github } from './providers/github';
import { logger } from '../utils';
import { notify } from '../shell';

const debug = logger('api');

export enum Status {
  SUCCESS,
  FAIL,
}

export enum ApiEvents {
  UPLOAD = 'UPLOAD',
  UPLOAD_FINISHED = 'UPLOAD_FINISHED',
  DOWNLOAD = 'DOWNLOAD',
  DOWNLOAD_FINISHED = 'DOWNLOAD_FINISHED',
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
    this.eventEmitter.on(ApiEvents.UPLOAD, this.upload.bind(this));
    this.eventEmitter.on(ApiEvents.DOWNLOAD, this.download.bind(this));
  }

  async upload(): Promise<void> {
    try {
      const result: Result = await this.provider.upload();
      this.eventEmitter.emit(ApiEvents.UPLOAD_FINISHED, result);
      notify(_(`Settings successfully uploaded to ${this.getName()}`));
    } catch (ex) {
      this.eventEmitter.emit(ApiEvents.UPLOAD_FINISHED, undefined, ex);
      notify(_(`Error occured while uploading settings to ${this.getName()}. Please check the logs.`));
      debug(`error occured during upload ${ex}`);
    }
  }

  async download(): Promise<void> {
    try {
      const result: Result = await this.provider.download();
      this.eventEmitter.emit(ApiEvents.DOWNLOAD_FINISHED, result);
      notify(_(`Settings successfully downloaded from ${this.getName()}`));
    } catch (ex) {
      this.eventEmitter.emit(ApiEvents.DOWNLOAD_FINISHED, undefined, ex);
      notify(_(`Error occured while downloading settings from ${this.getName()}. Please check the logs.`));
      debug(`error occured during download ${ex}`);
    }
  }

  getName(): string {
    return this.provider.getName();
  }
}
