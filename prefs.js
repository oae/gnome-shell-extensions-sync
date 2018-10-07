const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Preferences = class Preferences {

  constructor() {
    this.widget = new Gtk.Box();
    this.builder = Gtk.Builder.new_from_file(Me.dir.get_path() + "/ui/settings.glade");

    this.builder.connect_signals_full((builder,object,signal,handler) => {
      object.connect(signal, this[handler].bind(this));
    });

    const settingsBox = this.builder.get_object('gist-settings');

    this.widget.pack_start(settingsBox,true,true,0);
  }

  onSave() {
  }

  onCancel() {
  }

}

function init() {
}

function buildPrefsWidget() {
  let prefs = new Preferences();
  prefs.widget.show_all();

  return prefs.widget;
}
