import './styles/stylesheet.scss';
import { StatusMenu, ActionType } from './panel/statusMenu';
import { Sync } from './sync/sync';
import { Api } from './api';

export class SyncExtension {
  private sync: Sync;
  private statusMenu: StatusMenu;
  private api: Api;

  constructor() {
    this.api = new Api();
    this.sync = new Sync();
    this.statusMenu = new StatusMenu(this.api, async (type: ActionType) => {
      switch (type) {
        case ActionType.UPLOAD:
          await this.api.upload();
          break;
        case ActionType.DOWNLOAD:
          await this.api.download();
        default:
          break;
      }
    });
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

export default function(): SyncExtension {
  return new SyncExtension();
}
