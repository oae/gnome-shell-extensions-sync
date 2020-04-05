import { EventEmitter } from 'events';
import { ShellExtension } from '../shell';

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
  }

  stop(): void {
    log('stop sync');
  }
}
