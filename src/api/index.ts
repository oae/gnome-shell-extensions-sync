import { EventEmitter } from 'events';

import { Settings } from '@imports/Gio-2.0';

import { Github } from './providers/github';
import { logger } from '../utils';
import { notify, getCurrentExtensionSettings } from '../shell';
import { Gitlab } from './providers/gitlab';
import { SyncData, Data } from '../data';

const debug = logger('api');

export enum ApiOperationStatus {
  SUCCESS,
  FAIL,
}

export enum ApiEvent {
  UPLOAD = 'UPLOAD',
  UPLOAD_FINISHED = 'UPLOAD_FINISHED',
  DOWNLOAD = 'DOWNLOAD',
  DOWNLOAD_FINISHED = 'DOWNLOAD_FINISHED',
}

export enum ApiProviderType {
  GITHUB,
  GITLAB,
}

export interface ApiProvider {
  upload(syncData: SyncData): Promise<ApiOperationStatus>;
  download(): Promise<SyncData>;
  getName(): string;
}

export class Api {
  private provider: ApiProvider;
  private eventEmitter: EventEmitter;
  private settings: Settings;
  private data: Data;

  constructor(eventEmitter: EventEmitter, data: Data) {
    this.data = data;
    this.settings = getCurrentExtensionSettings();
    this.provider = this.createProvider();
    this.eventEmitter = eventEmitter;
    this.eventEmitter.on(ApiEvent.UPLOAD, this.upload.bind(this));
    this.eventEmitter.on(ApiEvent.DOWNLOAD, this.download.bind(this));
    this.settings.connect('changed', this.updateProvider.bind(this));
  }

  async upload(): Promise<void> {
    debug('got upload request, uploading settings...');
    try {
      const status: ApiOperationStatus = await this.provider.upload({
        ...(await this.data.getSyncData()),
      });
      if (status === ApiOperationStatus.FAIL) {
        throw new Error('Could not upload');
      }
      debug(`uploaded settings to ${this.provider.getName()} successfully`);
      this.eventEmitter.emit(ApiEvent.UPLOAD_FINISHED, status);
      notify(_(`Settings successfully uploaded to ${this.provider.getName()}`));
    } catch (ex) {
      this.eventEmitter.emit(ApiEvent.UPLOAD_FINISHED, undefined, ex);
      notify(_(`Error occured while uploading settings to ${this.provider.getName()}. Please check the logs.`));
      debug(`error occured during upload ${ex}`);
    }
  }

  async download(): Promise<void> {
    debug('got download request, downloading settings...');
    try {
      const result: SyncData = await this.provider.download();
      debug(`downloaded settings from ${this.provider.getName()} successfully`);
      this.eventEmitter.emit(ApiEvent.DOWNLOAD_FINISHED, result);
    } catch (ex) {
      this.eventEmitter.emit(ApiEvent.DOWNLOAD_FINISHED, undefined, ex);
      notify(_(`Error occured while downloading settings from ${this.provider.getName()}. Please check the logs.`));
      debug(`error occured during download ${ex}`);
    }
  }

  private createProvider(): ApiProvider {
    const providerType = this.settings.get_enum('provider') as ApiProviderType;
    debug(`changing provider to ${ApiProviderType[providerType]}`);

    switch (providerType) {
      case ApiProviderType.GITHUB:
        return this.createGithubProvider();
      case ApiProviderType.GITLAB:
        return this.createGitlabProvider();
      default:
        return this.createGithubProvider();
    }
  }

  private updateProvider(): void {
    this.provider = this.createProvider();
  }

  private createGithubProvider(): ApiProvider {
    const gistId = this.settings.get_string('github-gist-id');
    const userToken = this.settings.get_string('github-user-token');

    return new Github(gistId, userToken);
  }

  private createGitlabProvider(): ApiProvider {
    const snippetId = this.settings.get_string('gitlab-snippet-id');
    const userToken = this.settings.get_string('gitlab-user-token');

    return new Gitlab(snippetId, userToken);
  }
}
