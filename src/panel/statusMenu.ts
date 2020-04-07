import { EventEmitter } from 'events';
import { Icon } from '@imports/St-1.0';
import { icon_new_for_string, Settings } from '@imports/Gio-2.0';
import { getCurrentExtension, ShellExtension, getCurrentExtensionSettings } from '../shell';
import { ApiEvents } from '../api';

const { Button } = imports.ui.panelMenu;
const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const { panel } = imports.ui.main;

export class StatusMenu {
  private eventEmitter: EventEmitter;
  private button: any;
  private extension: ShellExtension;
  private settings: Settings;

  constructor(eventEmitter: EventEmitter) {
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
  }

  show(): void {
    if (this.settings.get_boolean('auto-sync') === true) {
      return;
    }

    if (this.button === undefined) {
      this.button = this.createButton();
    }

    this.eventEmitter.on(ApiEvents.UPLOAD, this.disableButton.bind(this));
    this.eventEmitter.on(ApiEvents.DOWNLOAD, this.disableButton.bind(this));

    this.eventEmitter.on(ApiEvents.UPLOAD_FINISHED, this.enableButton.bind(this));
    this.eventEmitter.on(ApiEvents.DOWNLOAD_FINISHED, this.enableButton.bind(this));

    if (!panel.statusArea['extensions-sync']) {
      panel.addToStatusArea('extensions-sync', this.button);
    }
  }

  hide(): void {
    if (this.button) {
      this.button.destroy();
      this.button = undefined;
    }

    this.eventEmitter.off(ApiEvents.UPLOAD, this.disableButton.bind(this));
    this.eventEmitter.off(ApiEvents.DOWNLOAD, this.disableButton.bind(this));

    this.eventEmitter.off(ApiEvents.UPLOAD_FINISHED, this.enableButton.bind(this));
    this.eventEmitter.off(ApiEvents.DOWNLOAD_FINISHED, this.enableButton.bind(this));
  }

  private createButton(): any {
    const newButton = new Button(0, _('Sync Settings'));

    newButton.icon = this.createIcon('synced');
    newButton.add_actor(newButton.icon);

    newButton.menu.addMenuItem(
      this.createMenuItem(_('Upload'), 'upload', () => this.eventEmitter.emit(ApiEvents.UPLOAD)),
    );
    newButton.menu.addMenuItem(
      this.createMenuItem(_('Download'), 'download', () => this.eventEmitter.emit(ApiEvents.DOWNLOAD)),
    );
    newButton.menu.addMenuItem(new PopupSeparatorMenuItem());
    newButton.menu.addMenuItem(this.createMenuItem(_('Preferences'), 'preferences'));

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
