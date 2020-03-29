import { Icon } from '@imports/St-1.0';
import { icon_new_for_string } from '@imports/Gio-2.0';
import { getCurrentExtension, ShellExtension } from '../shell';
import { Api } from '../api';

const { Button } = imports.ui.panelMenu;
const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const { panel } = imports.ui.main;

export enum ActionType {
  UPLOAD,
  DOWNLOAD,
}

export type OnAction = (type: ActionType) => Promise<void>;

export class StatusMenu {
  private api: Api;
  private button: any;
  private extension: ShellExtension;
  private onAction: OnAction;

  constructor(api: Api, onAction: OnAction) {
    this.onAction = onAction;
    this.api = api;
    this.extension = getCurrentExtension();
  }

  show(): void {
    if (this.button === undefined) {
      this.createButton();
    }

    panel.addToStatusArea('extensions-sync', this.button);
  }

  hide(): void {
    this.button.destroy();
    this.button = undefined;
  }

  private createButton(): void {
    this.button = new Button(0, _('Sync Settings'));
    this.button.icon = this.createIcon('synced');
    this.button.add_actor(this.button.icon);

    this.button.menu.addMenuItem(
      this.createMenuItem(_('Upload'), 'upload', async (type) => {
        this.button.icon.set_gicon(this.createIcon('syncing').gicon);
        try {
          await this.onAction(type);
          log('uploaded');
        } catch (ex) {
          log(`error occured during upload ${ex}`);
        }
        this.button.icon.set_gicon(this.createIcon('synced').gicon);
      }),
    );
    this.button.menu.addMenuItem(
      this.createMenuItem(_('Download'), 'download', async (type) => {
        this.button.icon.set_gicon(this.createIcon('syncing').gicon);
        try {
          await this.onAction(type);
          log('uploaded');
        } catch (ex) {
          log(`error occured during download ${ex}`);
        }
        this.button.icon.set_gicon(this.createIcon('synced').gicon);
      }),
    );
    this.button.menu.addMenuItem(new PopupSeparatorMenuItem());
    this.button.menu.addMenuItem(this.createMenuItem(_('Preferences'), 'preferences'));
  }

  private createMenuItem(menuTitle: string, actionType: string, onClick?: OnAction): any {
    const menuItem = new PopupImageMenuItem(`${menuTitle}`, this.createIcon(`${actionType}`).gicon);
    if (onClick) {
      menuItem.connect('activate', async () => {
        await onClick(ActionType[actionType.toUpperCase()]);
      });
    }

    return menuItem;
  }

  private createIcon(iconType: string): Icon {
    return new Icon({
      gicon: icon_new_for_string(`${this.extension.path}/icons/extensions-sync-${iconType}-symbolic.svg`),
      style_class: 'system-status-icon',
    });
  }
}
