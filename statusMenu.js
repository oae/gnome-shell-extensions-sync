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

const Util = imports.misc.util;

var StatusMenu = class StatusMenu {

  constructor() {
    this.button = new PanelMenu.Button(1,'StatusMenu',false);

    Gtk.IconTheme.get_default().append_search_path(imports.misc.extensionUtils.getCurrentExtension().dir.get_child('icons').get_path());

    let box = new St.BoxLayout();
    let icon = new St.Icon({ icon_name: 'extensions-sync-synced',style_class: 'system-status-icon' });

    box.add(icon);
    this.button.actor.add_child(box);

    let uploadMenuItem = new PopupMenu.PopupImageMenuItem('Upload','extensions-sync-upload');
    uploadMenuItem.connect('activate',async () => {
      icon.set_icon_name('extensions-sync-syncing');
      await sync.updateGist();
      icon.set_icon_name('extensions-sync-synced');
    });

    let downloadMenuItem = new PopupMenu.PopupImageMenuItem('Download','extensions-sync-download');
    downloadMenuItem.connect('activate',async () => {
      icon.set_icon_name('extensions-sync-syncing');
      await sync.updateLocal();
      icon.set_icon_name('extensions-sync-synced');
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
    Main.panel.addToStatusArea('StatusMenu',this.button,0,'right');
  }

  disable() {
    this.button.destroy();
  }
}
