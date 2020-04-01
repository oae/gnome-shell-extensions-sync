import { EventEmitter } from 'events';
import { Icon } from '@imports/St-1.0';
import { icon_new_for_string, Settings } from '@imports/Gio-2.0';
import { getCurrentExtension, ShellExtension, notify, getCurrentExtensionSettings } from '../shell';
import { Api } from '../api';
import { logger } from '../utils';
import { SyncEvents } from '../sync';

const { Button } = imports.ui.panelMenu;
const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const { panel } = imports.ui.main;

const debug = logger('status-menu');

export class StatusMenu {
  private api: Api;
  private eventEmitter: EventEmitter;
  private button: any;
  private extension: ShellExtension;
  private settings: Settings;

  constructor(api: Api, eventEmitter: EventEmitter) {
    this.api = api;
    this.eventEmitter = eventEmitter;
    this.extension = getCurrentExtension();
    this.settings = getCurrentExtensionSettings();
    this.settings.connect('changed::auto-sync', () => {
      if (this.settings.get_boolean('auto-sync') === true) {
        this.hide();
      } else {
        this.show();
      }
    });
    this.eventEmitter.on(SyncEvents.SYNCHRONIZED, () => {
      if (this.button !== undefined) {
        log('got sync finished event setting button to original');
        this.button.set_reactive(true);
        this.button.icon.set_gicon(this.createIcon('synced').gicon);
      }
    });
  }

  show(): void {
    if (this.settings.get_boolean('auto-sync') === true) {
      return;
    }

    if (this.button === undefined) {
      this.button = this.createButton();
    }

    panel.addToStatusArea('extensions-sync', this.button);
  }

  hide(): void {
    if (this.button) {
      this.button.destroy();
      this.button = undefined;
    }
  }

  private createButton(): any {
    const newButton = new Button(0, _('Sync Settings'));

    newButton.icon = this.createIcon('synced');
    newButton.add_actor(newButton.icon);

    newButton.menu.addMenuItem(
      this.createMenuItem(_('Upload'), 'upload', async () => {
        newButton.set_reactive(false);
        newButton.icon.set_gicon(this.createIcon('syncing').gicon);
        await this.uploadAction();
      }),
    );
    newButton.menu.addMenuItem(
      this.createMenuItem(_('Download'), 'download', async () => {
        newButton.set_reactive(false);
        newButton.icon.set_gicon(this.createIcon('syncing').gicon);
        await this.downloadAction();
      }),
    );
    newButton.menu.addMenuItem(new PopupSeparatorMenuItem());
    newButton.menu.addMenuItem(this.createMenuItem(_('Preferences'), 'preferences'));

    return newButton;
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
      await this.api.upload();
      notify(_(`Settings successfully uploaded to ${this.api.getName()}`));
    } catch (ex) {
      notify(_(`Error occured while uploading settings to ${this.api.getName()}. Please check the logs.`));
      debug(`error occured during upload ${ex}`);
    }
  }

  private async downloadAction(): Promise<void> {
    try {
      await this.api.download();
      notify(_(`Settings successfully downloaded from ${this.api.getName()}`));
    } catch (ex) {
      notify(_(`Error occured while downloading settings from ${this.api.getName()}. Please check the logs.`));
      debug(`error occured during download ${ex}`);
    }
  }
}
