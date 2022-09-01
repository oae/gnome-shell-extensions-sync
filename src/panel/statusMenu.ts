import { SyncEvent } from '@esync/api/types';
import { getCurrentExtension, getCurrentExtensionSettings, ShellExtension } from '@esync/shell';
import { execute, logger } from '@esync/utils';
import { icon_new_for_string, Settings } from '@gi-types/gio2';
import { Icon } from '@gi-types/st1';
import { EventEmitter } from 'events';

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
    this.settings.connect('changed::show-tray-icon', this.toggleStatusMenu.bind(this));
  }

  show(): void {
    const showTrayIcon = this.settings.get_boolean('show-tray-icon');
    if (!showTrayIcon) {
      return;
    }
    if (this.button === undefined) {
      this.button = this.createButton();
    }

    this.eventEmitter.on(SyncEvent.SAVE, this.disableButton.bind(this));
    this.eventEmitter.on(SyncEvent.READ, this.disableButton.bind(this));

    this.eventEmitter.on(SyncEvent.SAVE_FINISHED, this.enableButton.bind(this));
    this.eventEmitter.on(SyncEvent.READ_FINISHED, this.enableButton.bind(this));

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
      this.eventEmitter.off(SyncEvent.SAVE, this.disableButton.bind(this));
      this.eventEmitter.off(SyncEvent.READ, this.disableButton.bind(this));

      this.eventEmitter.off(SyncEvent.SAVE_FINISHED, this.enableButton.bind(this));
      this.eventEmitter.off(SyncEvent.READ_FINISHED, this.enableButton.bind(this));
      debug('removing status menu from panel');
    }
  }

  private toggleStatusMenu(): void {
    const showTrayIcon = this.settings.get_boolean('show-tray-icon');
    if (showTrayIcon) {
      this.show();
    } else {
      this.hide();
    }
  }

  private createButton(): any {
    const newButton = new Button(0, _('Sync Settings'));

    newButton.icon = this.createIcon('synced');
    newButton.add_actor(newButton.icon);

    newButton.menu.addMenuItem(
      this.createMenuItem(_('Upload'), 'upload', () => this.eventEmitter.emit(SyncEvent.SAVE)),
    );
    newButton.menu.addMenuItem(
      this.createMenuItem(_('Download'), 'download', () => this.eventEmitter.emit(SyncEvent.READ)),
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
