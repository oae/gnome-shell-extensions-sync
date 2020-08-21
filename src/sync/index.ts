import { ApiEvent } from '@esync/api/types';
import { Data, SyncData } from '@esync/data';
import { canRestartShell, notify, restartShell } from '@esync/shell';
import { logger } from '@esync/utils';
import { EventEmitter } from 'events';

export enum SyncEvents {
  SYNCHRONIZED,
}

const debug = logger('sync');

export class Sync {
  private eventEmitter: EventEmitter;
  private data: Data;

  constructor(eventEmitter: EventEmitter, data: Data) {
    this.data = data;
    this.eventEmitter = eventEmitter;
  }

  start(): void {
    this.eventEmitter.on(ApiEvent.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
    debug('listening for download completion events');
  }

  stop(): void {
    this.eventEmitter.off(ApiEvent.DOWNLOAD_FINISHED, this.onDownloadFinished.bind(this));
    debug('stopped listening for download completion events');
  }

  private async onDownloadFinished(syncData?: SyncData): Promise<void> {
    if (syncData === undefined) {
      return;
    }

    try {
      await this.data.use(syncData);
    } catch (ex) {
      notify(_('Failed to apply sync data to current system.'));
      debug(`failed to apply sync data to system: ${ex}`);
    }

    if (canRestartShell()) {
      restartShell(_('Extensions are updated. Reloading Gnome Shell'));
    } else {
      notify(_('Extensions are updated. Please reload Gnome Shell'));
    }
  }
}
