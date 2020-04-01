import { EventEmitter } from 'events';
import { ShellExtension } from '../shell';
import { ApiEvents } from '../api';
import { setTimeout } from '../utils';

export enum SyncEvents {
  SYNCHRONIZED,
}

export class Sync {
  private extensions: Array<ShellExtension>;
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.extensions = [];
    log('init sync');
  }

  start(): void {
    log('start sync');
    this.eventEmitter.on(ApiEvents.DOWNLOAD, this.onDownload.bind(this));
  }

  stop(): void {
    log('stop sync');
    this.eventEmitter.off(ApiEvents.DOWNLOAD, this.onDownload.bind(this));
  }

  private async onDownload(): Promise<void> {
    log('got download event');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    log('finished download, emitting sync finished event');
    this.eventEmitter.emit(SyncEvents.SYNCHRONIZED);
  }
}
