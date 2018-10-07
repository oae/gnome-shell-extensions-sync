const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Preferences = new Lang.Class({
  Name: 'ExtensionsSync.Preferences.Widget',
  GTypeName: 'Preferences',
  Extends: Gtk.Box,

  _init: function (params) {
    this.parent(params);

    const builder = Gtk.Builder.new_from_file(Me.dir.get_path() + "/ui/settings.glade");
    const settingsBox = builder.get_object('gist-settings');

    this.pack_start(settingsBox, true, true, 0);
  },
});

function init() {
}

function buildPrefsWidget() {
  let prefsWidget = new Preferences();
  prefsWidget.show_all();

  return prefsWidget;
}
