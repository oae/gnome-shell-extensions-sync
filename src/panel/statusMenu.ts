import { EventEmitter } from 'events';

import { Icon } from '@imports/St-1.0';
import { icon_new_for_string, Settings } from '@imports/Gio-2.0';

import { getCurrentExtension, ShellExtension, getCurrentExtensionSettings } from '../shell';
import { ApiEvent } from '../api';
import { execute, logger } from '../utils';

const { Button } = imports.ui.panelMenu;
const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const { panel } = imports.ui.main;

const debug = logger('statusMenu');

export class StatusMenu {
  private eventEmitter: EventEmitter;
  private button: any;
  private extension: ShellExtension;
  private settings: Settings;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.extension = getCurrentExtension();
    this.settings = getCurrentExtensionSettings();
  }

  show(): void {
    if (this.button === undefined) {
      this.button = this.createButton();
    }

    this.eventEmitter.on(ApiEvent.UPLOAD, this.disableButton.bind(this));
    this.eventEmitter.on(ApiEvent.DOWNLOAD, this.disableButton.bind(this));

    this.eventEmitter.on(ApiEvent.UPLOAD_FINISHED, this.enableButton.bind(this));
    this.eventEmitter.on(ApiEvent.DOWNLOAD_FINISHED, this.enableButton.bind(this));

    panel.addToStatusArea('extensions-sync', this.button);
    debug('showing status menu in panel');
  }

  hide(): void {
    if (this.button) {
      this.button.destroy();
      this.button = undefined;
    }
    if (panel.statusArea['extensions-sync']) {
      panel.statusArea['extensions-sync'].destroy();
      this.eventEmitter.off(ApiEvent.UPLOAD, this.disableButton.bind(this));
      this.eventEmitter.off(ApiEvent.DOWNLOAD, this.disableButton.bind(this));

      this.eventEmitter.off(ApiEvent.UPLOAD_FINISHED, this.enableButton.bind(this));
      this.eventEmitter.off(ApiEvent.DOWNLOAD_FINISHED, this.enableButton.bind(this));
      debug('removing status menu from panel');
    }
  }

  private createButton(): any {
    const newButton = new Button(0, _('Sync Settings'));

    newButton.icon = this.createIcon('synced');
    newButton.add_actor(newButton.icon);

    newButton.menu.addMenuItem(
      this.createMenuItem(_('Upload'), 'upload', () => this.eventEmitter.emit(ApiEvent.UPLOAD)),
    );
    newButton.menu.addMenuItem(
      this.createMenuItem(_('Download'), 'download', () => this.eventEmitter.emit(ApiEvent.DOWNLOAD)),
    );
    newButton.menu.addMenuItem(new PopupSeparatorMenuItem());
    newButton.menu.addMenuItem(
      this.createMenuItem(_('Preferences'), 'preferences', () => {
        execute(`gnome-extensions prefs "${this.extension.metadata.uuid}"`);
      }),
    );

    return newButton;
  }

  private createMenuItem(menuTitle: string, actionType: string, onClick?: () => void): any {
    const menuItem = new PopupImageMenuItem(`${menuTitle}`, this.createIcon(`${actionType}`).gicon);
    if (onClick) {
      menuItem.connect('activate', () => onClick());
    }

    return menuItem;
  }

  private createIcon(iconType: string): Icon {
    return new Icon({
      gicon: icon_new_for_string(`${this.extension.path}/icons/extensions-sync-${iconType}-symbolic.svg`),
      style_class: 'system-status-icon',
    });
  }

  private enableButton(): void {
    if (this.button !== undefined) {
      this.button.set_reactive(true);
      this.button.icon.set_gicon(this.createIcon('synced').gicon);
    }
  }

  private disableButton(): void {
    if (this.button !== undefined) {
      this.button.set_reactive(false);
      this.button.icon.set_gicon(this.createIcon('syncing').gicon);
      this.button.menu.close();
    }
  }
}
