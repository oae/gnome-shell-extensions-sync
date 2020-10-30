import { Github } from '@esync/api/providers/github';
import { Gitlab } from '@esync/api/providers/gitlab';
import { Data, SyncData } from '@esync/data';
import { getCurrentExtensionSettings, notify } from '@esync/shell';
import { logger } from '@esync/utils';
import { Settings } from '@imports/Gio-2.0';
import { EventEmitter } from 'events';
import { Local } from './providers/local';
import { SyncProvider, SyncEvent, SyncOperationStatus, SyncProviderType } from './types';

const debug = logger('api');

export class Api {
  private provider: SyncProvider;
  private eventEmitter: EventEmitter;
  private settings: Settings;
  private data: Data;

  constructor(eventEmitter: EventEmitter, data: Data) {
    this.data = data;
    this.settings = getCurrentExtensionSettings();
    this.provider = this.createProvider();
    this.eventEmitter = eventEmitter;
    this.eventEmitter.on(SyncEvent.SAVE, this.save.bind(this));
    this.eventEmitter.on(SyncEvent.READ, this.read.bind(this));
    this.settings.connect('changed', this.updateProvider.bind(this));
  }

  async save(): Promise<void> {
    debug('got save request, saving settings...');
    try {
      const status: SyncOperationStatus = await this.provider.save({
        ...(await this.data.getSyncData()),
      });
      if (status === SyncOperationStatus.FAIL) {
        throw new Error('Could not save');
      }
      debug(`saved settings to ${this.provider.getName()} successfully`);
      this.eventEmitter.emit(SyncEvent.SAVE_FINISHED, status);
      notify(_(`Settings successfully saved to ${this.provider.getName()}`));
    } catch (ex) {
      this.eventEmitter.emit(SyncEvent.SAVE_FINISHED, undefined, ex);
      notify(_(`Error occured while saving settings to ${this.provider.getName()}. Please check the logs.`));
      debug(`error occured during save. -> ${ex}`);
    }
  }

  async read(): Promise<void> {
    debug('got read request, reading settings...');
    try {
      const result: SyncData = await this.provider.read();
      debug(`read settings from ${this.provider.getName()} successfully`);
      this.eventEmitter.emit(SyncEvent.READ_FINISHED, result);
    } catch (ex) {
      this.eventEmitter.emit(SyncEvent.READ_FINISHED, undefined, ex);
      notify(_(`Error occured while reading settings from ${this.provider.getName()}. Please check the logs.`));
      debug(`error occured during read. -> ${ex}`);
    }
  }

  private createProvider(): SyncProvider {
    const providerType = this.settings.get_enum('provider') as SyncProviderType;
    debug(`changing provider to ${SyncProviderType[providerType]}`);

    switch (providerType) {
      case SyncProviderType.GITHUB:
        return this.createGithubProvider();
      case SyncProviderType.GITLAB:
        return this.createGitlabProvider();
      case SyncProviderType.LOCAL:
        return this.createLocalProvider();
      default:
        return this.createGithubProvider();
    }
  }

  private updateProvider(): void {
    this.provider = this.createProvider();
  }

  private createGithubProvider(): SyncProvider {
    const gistId = this.settings.get_string('github-gist-id');
    const userToken = this.settings.get_string('github-user-token');

    return new Github(gistId, userToken);
  }

  private createGitlabProvider(): SyncProvider {
    const snippetId = this.settings.get_string('gitlab-snippet-id');
    const userToken = this.settings.get_string('gitlab-user-token');

    return new Gitlab(snippetId, userToken);
  }

  private createLocalProvider(): SyncProvider {
    const backupfileLocation = this.settings.get_string('backup-file-location');

    return new Local(backupfileLocation);
  }
}
