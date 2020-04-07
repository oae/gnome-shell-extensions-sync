import { EventEmitter } from 'events';
import { SyncData, ApiEvents } from '../api';
import { getCurrentExtensionSettings, setExtensionConfigData } from '../shell';
import { Settings } from '@imports/Gio-2.0';

export enum SyncEvents {
  SYNCHRONIZED,
}

export class Sync {
  private eventEmitter: EventEmitter;
  private settings: Settings;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.settings = getCurrentExtensionSettings();
  }

  start(): void {
    log('start sync');
    this.eventEmitter.on(ApiEvents.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
  }

  stop(): void {
    log('stop sync');
    this.eventEmitter.off(ApiEvents.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
  }

  private onDownloadFinished(syncData?: SyncData): void {
    if (syncData === undefined) {
      return;
    }
    const localLastUpdatedAt = new Date(this.settings.get_string('last-updated-at'));
    const remoteLastUpdatedAt = new Date(syncData.syncSettings.lastUpdatedAt);

    if (localLastUpdatedAt >= remoteLastUpdatedAt) {
      return;
    }

    const downloadedExtensions = Object.keys(syncData.extensions);

    downloadedExtensions.forEach((extensionId) => {
      Object.keys(syncData.extensions[extensionId]).forEach((schemaPath) => {
        setExtensionConfigData(schemaPath, syncData.extensions[extensionId][schemaPath]);
      });
    });

    this.settings.set_string('last-updated-at', remoteLastUpdatedAt.toString());
    this.settings.set_boolean('auto-sync', syncData.syncSettings.autoSync);
  }
}
