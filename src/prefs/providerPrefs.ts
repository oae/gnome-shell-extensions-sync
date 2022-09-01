import { SyncProviderType } from '@esync/api/types';
import { File, FileCreateFlags, FilePrototype } from '@gi-types/gio2';
import { get_user_config_dir } from '@gi-types/glib2';
import { registerClass } from '@gi-types/gobject2';
import {
  Align,
  Box,
  Button,
  ComboBoxText,
  Entry,
  FileChooserAction,
  FileChooserDialog,
  FileFilter,
  Label,
  Orientation,
  ResponseType,
  Window,
} from '@gi-types/gtk4';
import { PrefsTab } from '@esync/prefs/prefsTab';

export const ProviderPrefs = registerClass(
  {},
  class ProviderPrefs extends PrefsTab {
    private githubSettings: Box;
    private gitlabSettings: Box;
    private localSettings: Box;

    _init() {
      super._init({
        title: 'Provider',
        orientation: Orientation.VERTICAL,
        marginTop: 24,
        marginBottom: 24,
        marginStart: 12,
        marginEnd: 12,
      });

      const providerSelectionContainer = new Box({
        marginTop: 24,
        marginBottom: 24,
        marginStart: 15,
        marginEnd: 15,
        orientation: Orientation.VERTICAL,
      });

      providerSelectionContainer.append(
        new Label({
          label: 'Provider',
          halign: Align.START,
          valign: Align.FILL,
          marginBottom: 12,
        }),
      );

      const providerSelectionCombo = new ComboBoxText({
        marginBottom: 12,
        halign: Align.FILL,
        valign: Align.FILL,
      });

      providerSelectionCombo.insert(0, 'Github', 'Github');
      providerSelectionCombo.insert(1, 'Gitlab', 'Gitlab');
      providerSelectionCombo.insert(2, 'Local', 'Local');

      const activeProvider = this.settings.get_enum('provider');
      providerSelectionCombo.set_active(activeProvider);

      providerSelectionCombo.connect('changed', () => {
        const newProvider = providerSelectionCombo.get_active();
        this.githubSettings.hide();
        this.gitlabSettings.hide();
        this.localSettings.hide();
        if (newProvider === SyncProviderType.GITHUB) {
          this.githubSettings.show();
        } else if (newProvider === SyncProviderType.GITLAB) {
          this.gitlabSettings.show();
        } else if (newProvider === SyncProviderType.LOCAL) {
          this.localSettings.show();
        }
        this.settings.set_enum('provider', newProvider);
      });

      providerSelectionContainer.append(providerSelectionCombo);

      this.append(providerSelectionContainer);
      this.githubSettings = this.createRemoteSettings(
        'Gist Id',
        'github-gist-id',
        'github-user-token',
        activeProvider === 0,
      );
      this.append(this.githubSettings);

      this.gitlabSettings = this.createRemoteSettings(
        'Snippet Id',
        'gitlab-snippet-id',
        'gitlab-user-token',
        activeProvider === 1,
      );
      this.append(this.gitlabSettings);

      this.localSettings = this.createLocalSettings(activeProvider === 2);
      this.append(this.localSettings);
    }

    createRemoteSettings(
      locationText: string,
      locationSettingKey: string,
      userTokenSettingKey: string,
      show: boolean,
    ): Box {
      const container = new Box({
        orientation: Orientation.VERTICAL,
        marginBottom: 10,
        marginStart: 15,
        marginEnd: 15,
      });

      const locationContainer = new Box({
        orientation: Orientation.VERTICAL,
      });

      locationContainer.append(
        new Label({
          label: locationText,
          marginBottom: 6,
          halign: Align.START,
          valign: Align.FILL,
        }),
      );

      const locationEntry = new Entry({
        marginBottom: 24,
        halign: Align.FILL,
        valign: Align.BASELINE,
      });
      locationEntry.set_text(this.settings.get_string(locationSettingKey));

      locationEntry.connect('changed', () => {
        this.settings.set_string(locationSettingKey, locationEntry.get_text());
      });

      locationContainer.append(locationEntry);

      container.append(locationContainer);

      const userTokenContainer = new Box({
        orientation: Orientation.VERTICAL,
      });

      userTokenContainer.append(
        new Label({
          label: 'User Token',
          marginBottom: 6,
          halign: Align.START,
          valign: Align.FILL,
        }),
      );

      const userTokenEntry = new Entry({
        marginBottom: 24,
        halign: Align.FILL,
        valign: Align.BASELINE,
      });
      userTokenEntry.set_text(this.settings.get_string(userTokenSettingKey));

      userTokenEntry.connect('changed', () => {
        this.settings.set_string(userTokenSettingKey, userTokenEntry.get_text());
      });

      userTokenContainer.append(userTokenEntry);

      container.append(userTokenContainer);

      if (show === false) {
        container.hide();
      }

      return container;
    }

    createLocalSettings(show: boolean): Box {
      const container = new Box({
        orientation: Orientation.VERTICAL,
        marginBottom: 10,
        marginStart: 15,
        marginEnd: 15,
      });

      const locationContainer = new Box({
        orientation: Orientation.VERTICAL,
      });

      locationContainer.append(
        new Label({
          label: 'Backup File',
          marginBottom: 6,
          halign: Align.START,
          valign: Align.FILL,
        }),
      );

      const backupFileUri = this.settings.get_string('backup-file-location');
      let buttonLabel = 'Select backup file location';
      if (backupFileUri) {
        const backupFile = File.new_for_uri(backupFileUri);
        if (backupFile.query_exists(null)) {
          buttonLabel = backupFile.get_uri();
        }
      }
      const locationButton = new Button({
        marginBottom: 24,
        halign: Align.FILL,
        label: buttonLabel,
        valign: Align.BASELINE,
      });
      locationButton.connect('clicked', () => {
        const dialog = new FileChooserDialog({
          title: 'Select backup file location',
        });
        dialog.set_action(FileChooserAction.SAVE);
        dialog.set_select_multiple(false);

        dialog.set_current_folder(File.new_for_path(get_user_config_dir()));

        // Add the buttons and its return values
        dialog.add_button('Cancel', ResponseType.CANCEL);
        dialog.add_button('OK', ResponseType.OK);
        const filter = new FileFilter();
        filter.add_pattern('*.json');
        dialog.set_filter(filter);
        dialog.set_transient_for(this.get_root() as any as Window);
        dialog.connect('response', (_, response) => {
          if (response === ResponseType.OK) {
            const backupFile: FilePrototype | null = dialog.get_file();
            if (backupFile) {
              if (!backupFile.query_exists(null)) {
                backupFile.create(FileCreateFlags.PRIVATE, null);
              }
              locationButton.label = backupFile.get_uri();
              this.settings.set_string('backup-file-location', backupFile.get_uri());
            }
          }

          dialog.destroy();
        });

        dialog.show();
      });

      locationContainer.append(locationButton);

      container.append(locationContainer);

      if (show === false) {
        container.hide();
      }

      return container;
    }
  },
);
