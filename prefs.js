// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

imports.searchPath.unshift(imports.misc.extensionUtils.getCurrentExtension().path);

const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { getSettings } = imports.convenience;
const { logger } = imports.utils;
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
    this.settings.set_string('gist-id', gistId);

    const gistToken = this.gistTokenEntry.get_text();
    this.settings.set_string('gist-token', gistToken);

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
