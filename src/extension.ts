import { Api } from '@esync/api';
import { Data } from '@esync/data';
import { StatusMenu } from '@esync/panel/statusMenu';
import { Sync } from '@esync/sync';
import { logger } from '@esync/utils';
import { EventEmitter } from 'events';
import './styles/stylesheet.scss';

const debug = logger('extension');

class SyncExtension {
  private sync: Sync;
  private statusMenu: StatusMenu;
  private api: Api;
  private eventEmitter: EventEmitter;
  private data: Data;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.data = new Data();
    this.api = new Api(this.eventEmitter, this.data);
    this.sync = new Sync(this.eventEmitter, this.data);
    this.statusMenu = new StatusMenu(this.eventEmitter);
    debug('extension is initialized');
  }

  enable(): void {
    this.sync.start();
    this.statusMenu.show();
    debug('extension is enabled');
  }

  disable(): void {
    this.sync.stop();
    this.statusMenu.hide();
    debug('extension is disabled');
  }
}

export default function (): SyncExtension {
  return new SyncExtension();
}
