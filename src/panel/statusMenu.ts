import { Icon } from '@imports/St-1.0';
import { icon_new_for_string } from '@imports/Gio-2.0';
import { getCurrentExtension, ShellExtension, notify } from '../shell';
import { Api } from '../api';

const { Button } = imports.ui.panelMenu;
const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const { panel } = imports.ui.main;

export class StatusMenu {
  private api: Api;
  private button: any;
  private extension: ShellExtension;

  constructor(api: Api) {
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
      this.createMenuItem(_('Upload'), 'upload', async () => {
        this.button.icon.set_gicon(this.createIcon('syncing').gicon);
        await this.uploadAction();
        this.button.icon.set_gicon(this.createIcon('synced').gicon);
      }),
    );
    this.button.menu.addMenuItem(
      this.createMenuItem(_('Download'), 'download', async () => {
        this.button.icon.set_gicon(this.createIcon('syncing').gicon);
        await this.downloadAction();
        this.button.icon.set_gicon(this.createIcon('synced').gicon);
      }),
    );
    this.button.menu.addMenuItem(new PopupSeparatorMenuItem());
    this.button.menu.addMenuItem(this.createMenuItem(_('Preferences'), 'preferences'));
  }

  private createMenuItem(menuTitle: string, actionType: string, onClick?: () => Promise<void>): any {
    const menuItem = new PopupImageMenuItem(`${menuTitle}`, this.createIcon(`${actionType}`).gicon);
    if (onClick) {
      menuItem.connect('activate', async () => {
        await onClick();
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

  private async uploadAction(): Promise<void> {
    try {
      notify(_(`Uploading settings to ${this.api.getName()}`));
      await this.api.upload();
      notify(_(`Settings successfully uploaded to ${this.api.getName()}`));
    } catch (ex) {
      notify(_(`Error occured while uploading settings to ${this.api.getName()}. Please check the logs.`));
      log(`error occured during upload ${ex}`);
    }
  }

  private async downloadAction(): Promise<void> {
    try {
      notify(_(`Downloading settings from ${this.api.getName()}`));
      await this.api.download();
      notify(_(`Settings successfully downloaded from ${this.api.getName()}`));
    } catch (ex) {
      notify(_(`Error occured while downloading settings from ${this.api.getName()}. Please check the logs.`));
      log(`error occured during download ${ex}`);
    }
  }
}
