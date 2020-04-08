import { EventEmitter } from 'events';
import { SyncData, ApiEvents } from '../api';
import { setExtensionConfigData, notify } from '../shell';

export enum SyncEvents {
  SYNCHRONIZED,
}

export class Sync {
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  start(): void {
    this.eventEmitter.on(ApiEvents.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
  }

  stop(): void {
    this.eventEmitter.off(ApiEvents.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
  }

  private onDownloadFinished(syncData?: SyncData): void {
    if (syncData === undefined) {
      return;
    }

    notify(_('Settings are being updated.'));

    const downloadedExtensions = Object.keys(syncData.extensions);

    downloadedExtensions.forEach((extensionId) => {
      Object.keys(syncData.extensions[extensionId]).forEach((schemaPath) => {
        setExtensionConfigData(schemaPath, syncData.extensions[extensionId][schemaPath]);
      });
    });
  }
}
