import { logger } from '../utils';
import { getCurrentExtensionSettings, ShellExtension, getCurrentExtension } from '../shell';
import { Settings } from '@imports/Gio-2.0';
import { Box, Builder, Entry } from '@imports/Gtk-3.0';

const debug = logger('prefs');

class Preferences {
  private extension: ShellExtension;
  private settings: Settings;
  private builder: Builder;
  private githubGistIdEntry: Entry;
  private githubGistTokenEntry: Entry;

  widget: Box;

  constructor() {
    this.extension = getCurrentExtension();
    this.settings = getCurrentExtensionSettings();
    this.widget = new Box();
    this.builder = Builder.new_from_file(`${this.extension.path}/ui/prefs.glade`);
    this.builder.connect_signals_full((builder, object, signal, handler) => {
      object.connect(signal, this[handler].bind(this));
    });

    const settingsBox = this.builder.get_object('github-gist-settings') as Box;

    this.githubGistIdEntry = this.builder.get_object('github-gist-id-entry') as Entry;
    this.githubGistTokenEntry = this.builder.get_object('github-gist-token-entry') as Entry;

    if (null !== settingsBox) {
      this.widget.pack_start(settingsBox, true, true, 0);
    }

    this.initValues();
  }

  private initValues(): void {
    const githubGistId = this.settings.get_string('github-gist-id');
    this.githubGistIdEntry.set_text(githubGistId);

    const githubGistToken = this.settings.get_string('github-gist-token');
    this.githubGistTokenEntry.set_text(githubGistToken);
  }

  private onSave(): void {
    const gistId = this.githubGistIdEntry.get_text();
    this.settings.set_string('github-gist-id', gistId.trim());

    const gistToken = this.githubGistTokenEntry.get_text();
    this.settings.set_string('github-gist-token', gistToken.trim());

    this.onClose();
  }

  private onClose(): void {
    this.widget.get_toplevel().destroy();
  }
}

const init = (): void => {
  debug('prefs initialized');
};

const buildPrefsWidget = (): any => {
  const prefs = new Preferences();
  prefs.widget.show_all();

  return prefs.widget;
};

export default { init, buildPrefsWidget };
