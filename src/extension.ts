import { EventEmitter } from 'events';
import './styles/stylesheet.scss';
import { StatusMenu } from './panel/statusMenu';
import { Sync } from './sync';
import { Api } from './api';

export class SyncExtension {
  private sync: Sync;
  private statusMenu: StatusMenu;
  private api: Api;
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.api = new Api(this.eventEmitter);
    this.sync = new Sync(this.eventEmitter);
    this.statusMenu = new StatusMenu(this.eventEmitter);
  }

  enable(): void {
    this.sync.start();
    this.statusMenu.show();
  }

  disable(): void {
    this.sync.stop();
    this.statusMenu.hide();
    this.eventEmitter.removeAllListeners();
  }
}

export default function (): SyncExtension {
  return new SyncExtension();
}
