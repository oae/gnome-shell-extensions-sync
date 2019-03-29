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

window.extensionsSync = {
  imports: imports.misc.extensionUtils.getCurrentExtension().imports
}


const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { getSettings } = extensionsSync.imports.convenience;

const { logger } = extensionsSync.imports.utils;
const debug = logger('prefs');

const Preferences = class Preferences {

  constructor() {
    this.settings = getSettings('org.gnome.shell.extensions.sync');
    this.widget = new Gtk.Box();
    this.builder = Gtk.Builder.new_from_file(Me.dir.get_path() + "/ui/settings.glade");
    this.builder.connect_signals_full((builder,object,signal,handler) => {
      object.connect(signal, this[handler].bind(this));
    });

    const settingsBox = this.builder.get_object('gist-settings');

    this.gistIdEntry = this.builder.get_object('gist-id-entry');
    this.gistTokenEntry = this.builder.get_object('gist-token-entry');

    this.widget.pack_start(settingsBox,true,true,0);

    this.initValues();
  }

  initValues() {
    const gistId = this.settings.get_string('gist-id');
    this.gistIdEntry.set_text(gistId);

    const gistToken = this.settings.get_string('gist-token');
    this.gistTokenEntry.set_text(gistToken);
  }

  onSave() {
    const gistId = this.gistIdEntry.get_text();
    this.settings.set_string('gist-id', gistId.trim());

    const gistToken = this.gistTokenEntry.get_text();
    this.settings.set_string('gist-token', gistToken.trim());

    this.onClose();
  }

  onClose() {
    this.widget.get_toplevel().destroy();
  }

}

function init() {
}

function buildPrefsWidget() {
  let prefs = new Preferences();
  prefs.widget.show_all();

  return prefs.widget;
}
