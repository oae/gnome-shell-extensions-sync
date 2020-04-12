import { EventEmitter } from 'events';
import { SyncData, ApiEvents } from '../api';
import {
  setExtensionConfigData,
  getExtensionIds,
  removeExtension,
  installExtension,
  restartShell,
  canRestartShell,
  notify,
} from '../shell';
import { logger } from '../utils';

export enum SyncEvents {
  SYNCHRONIZED,
}

const debug = logger('sync');

export class Sync {
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  start(): void {
    this.eventEmitter.on(ApiEvents.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
    debug('listening for download completion events');
  }

  stop(): void {
    this.eventEmitter.off(ApiEvents.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
    debug('stopped listening for download completion events');
  }

  private async onDownloadFinished(syncData?: SyncData): Promise<void> {
    if (syncData === undefined) {
      return;
    }

    const downloadedExtensions = Object.keys(syncData.extensions);
    const localExtensions = getExtensionIds();
    localExtensions.forEach(
      (extensionId) => downloadedExtensions.indexOf(extensionId) < 0 && removeExtension(extensionId),
    );

    await Promise.all(
      downloadedExtensions.map((extensionId) => {
        return Object.keys(syncData.extensions[extensionId]).map((schemaPath) => {
          return setExtensionConfigData(schemaPath, syncData.extensions[extensionId][schemaPath]);
        });
      }),
    );

    await Promise.all(
      downloadedExtensions.map(
        async (extensionId) => localExtensions.indexOf(extensionId) < 0 && installExtension(extensionId),
      ),
    );

    if (canRestartShell()) {
      restartShell(_('Extensions are updated. Reloading Gnome Shell'));
    } else {
      notify(_('Extensions are updated. Please reload Gnome Shell'));
    }
  }
}
