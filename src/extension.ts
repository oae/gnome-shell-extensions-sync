import './styles/stylesheet.scss';
import { StatusMenu } from './panel/statusMenu';
import { Sync } from './sync';
import { Api } from './api';

export class SyncExtension {
  private sync: Sync;
  private statusMenu: StatusMenu;
  private api: Api;

  constructor() {
    this.api = new Api();
    this.sync = new Sync();
    this.statusMenu = new StatusMenu(this.api);
  }

  enable(): void {
    this.statusMenu.show();
    this.sync.start();
  }

  disable(): void {
    this.statusMenu.hide();
    this.sync.stop();
  }
}

export default function (): SyncExtension {
  return new SyncExtension();
}
