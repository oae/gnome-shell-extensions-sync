// Copyright (C) 2018 O. Alperen Elhan
//
// This file is part of Extensions Sync.
//
// Extensions Sync is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// Extensions Sync is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Extensions Sync.  If not, see <http://www.gnu.org/licenses/>.
//

const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Gio = imports.gi.Gio;

const Me = ExtensionUtils.getCurrentExtension();

var StatusMenu = class StatusMenu {

  constructor() {
    this.button = new PanelMenu.Button(1, extensionsSync.metadata["gettext-domain"], false);

    Gtk.IconTheme.get_default().append_search_path(imports.misc.extensionUtils.getCurrentExtension().dir.get_child('icons').get_path());

    let box = new St.BoxLayout();
    let gSyncedIcon = Gio.icon_new_for_string(Me.path + "/icons/extensions-sync-synced-symbolic.svg");
    let gSyncingIcon = Gio.icon_new_for_string(Me.path + "/icons/extensions-sync-syncing-symbolic.svg");
    let gDownloadIcon = Gio.icon_new_for_string(Me.path + "/icons/extensions-sync-download-symbolic.svg");
    let gUploadIcon = Gio.icon_new_for_string(Me.path + "/icons/extensions-sync-upload-symbolic.svg");

    let icon = new St.Icon({ gicon: gSyncedIcon, style_class: 'system-status-icon' });

    box.add(icon);
    this.button.add_child(box);

    let uploadMenuItem = new PopupMenu.PopupImageMenuItem('Upload', gUploadIcon);
    uploadMenuItem.connect('activate',async () => {
      icon.set_gicon(gSyncingIcon);
      await extensionsSync.sync.updateGist();
      icon.set_gicon(gSyncedIcon);
      Main.notify("Settings uploaded successfully!");
    });

    let downloadMenuItem = new PopupMenu.PopupImageMenuItem('Download', gDownloadIcon);
    downloadMenuItem.connect('activate',async () => {
      icon.set_gicon(gSyncingIcon);
      await extensionsSync.sync.updateLocal();
      icon.set_gicon(gSyncedIcon);
      Main.notify("Settings downloaded successfully!");
    });

    let settingsMenuItem = new PopupMenu.PopupImageMenuItem('Settings','preferences-system-symbolic');
    settingsMenuItem.connect('activate',() => {
      Util.spawn(['gnome-shell-extension-prefs','extensions-sync@elhan.io']);
    });

    this.button.menu.addMenuItem(uploadMenuItem);
    this.button.menu.addMenuItem(downloadMenuItem);
    this.button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this.button.menu.addMenuItem(settingsMenuItem);
  }

  enable() {
    Main.panel.addToStatusArea('extension-sync-status-item', this.button, 0, 'right');
  }

  disable() {
    this.button.destroy();
  }
}
