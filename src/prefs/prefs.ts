import { logger } from '../utils';
import { getCurrentExtensionSettings, ShellExtension, getCurrentExtension } from '../shell';
import { Settings } from '@imports/Gio-2.0';
import { Box, Builder, Entry, ComboBoxText } from '@imports/Gtk-3.0';
import { ProviderTypes } from '../api';

const debug = logger('prefs');

class Preferences {
  private extension: ShellExtension;
  private settings: Settings;
  private builder: Builder;
  private providerCombBoxText: ComboBoxText;
  private githubSettingsBox: Box;
  private gitlabSettingsBox: Box;
  private githubUserTokenEntry: Entry;
  private githubGistIdEntry: Entry;
  private gitlabUserTokenEntry: Entry;
  private gitlabSnippetIdEntry: Entry;

  widget: Box;

  constructor() {
    this.extension = getCurrentExtension();
    this.settings = getCurrentExtensionSettings();
    this.widget = new Box();
    this.builder = Builder.new_from_file(`${this.extension.path}/ui/prefs.glade`);
    this.builder.connect_signals_full((builder, object, signal, handler) => {
      object.connect(signal, this[handler].bind(this));
    });

    const settingsBox = this.builder.get_object('sync-settings') as Box;

    this.githubSettingsBox = this.builder.get_object('github-settings') as Box;
    this.gitlabSettingsBox = this.builder.get_object('gitlab-settings') as Box;

    this.providerCombBoxText = this.builder.get_object('provider-select') as ComboBoxText;

    this.githubUserTokenEntry = this.builder.get_object('github-user-token-entry') as Entry;
    this.githubGistIdEntry = this.builder.get_object('github-gist-id-entry') as Entry;

    this.gitlabUserTokenEntry = this.builder.get_object('gitlab-user-token-entry') as Entry;
    this.gitlabSnippetIdEntry = this.builder.get_object('gitlab-snippet-id-entry') as Entry;

    if (null !== settingsBox) {
      this.widget.pack_start(settingsBox, true, true, 0);
    }

    this.initValues();
  }

  private initValues(): void {
    const provider = this.settings.get_enum('provider');
    this.providerCombBoxText.set_active(provider);

    const githubGistId = this.settings.get_string('github-gist-id');
    this.githubGistIdEntry.set_text(githubGistId);

    const githubUserToken = this.settings.get_string('github-user-token');
    this.githubUserTokenEntry.set_text(githubUserToken);

    const gitlabSnippetId = this.settings.get_string('gitlab-snippet-id');
    this.gitlabSnippetIdEntry.set_text(gitlabSnippetId);

    const gitlabUserToken = this.settings.get_string('gitlab-user-token');
    this.gitlabUserTokenEntry.set_text(gitlabUserToken);
  }

  private onProviderChange(): void {
    const provider = this.providerCombBoxText.get_active();

    this.githubSettingsBox.set_visible(false);
    this.gitlabSettingsBox.set_visible(false);
    this.githubSettingsBox.set_no_show_all(true);
    this.gitlabSettingsBox.set_no_show_all(true);
    if (provider === ProviderTypes.GITHUB) {
      this.githubSettingsBox.set_visible(true);
      this.githubSettingsBox.set_no_show_all(false);
    } else if (provider === ProviderTypes.GITLAB) {
      this.gitlabSettingsBox.set_visible(true);
      this.gitlabSettingsBox.set_no_show_all(false);
    }
  }

  private onSave(): void {
    const provider = this.providerCombBoxText.get_active();
    this.settings.set_enum('provider', provider);

    const githubGistId = this.githubGistIdEntry.get_text();
    this.settings.set_string('github-gist-id', githubGistId.trim());

    const githubUserToken = this.githubUserTokenEntry.get_text();
    this.settings.set_string('github-user-token', githubUserToken.trim());

    const gitlabSnippetId = this.gitlabSnippetIdEntry.get_text();
    this.settings.set_string('gitlab-snippet-id', gitlabSnippetId.trim());

    const gitlabUserToken = this.gitlabUserTokenEntry.get_text();
    this.settings.set_string('gitlab-user-token', gitlabUserToken.trim());

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
