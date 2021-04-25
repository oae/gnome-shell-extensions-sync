import { DataProviderType } from '@esync/data';
import { settingsFlagsToEnumList } from '@esync/utils';
import { registerClass } from '@imports/gobject2';
import { Align, Box, Label, ListBoxRow, Orientation, Switch } from '@imports/gtk4';
import { PrefsTab } from './prefsTab';

export const SyncedDataPrefs = registerClass(
  {},
  class SyncedDataPrefs extends PrefsTab {
    _init() {
      super._init({
        title: 'Synced Data',
        orientation: Orientation.VERTICAL,
        marginTop: 24,
        marginBottom: 24,
        marginStart: 12,
        marginEnd: 12,
      });

      this.createSettingRows(
        'Extensions',
        'Syncs all extensions and their configurations.',
        DataProviderType.EXTENSIONS,
      );
      this.createSettingRows('Keybindings', 'Syncs all gnome shell and gtk keybindings.', DataProviderType.KEYBINDINGS);
      this.createSettingRows('Tweaks', 'Syncs gnome settings changed from tweak tool.', DataProviderType.TWEAKS);
    }

    createSettingRows(label: string, description: string, dataProviderType: DataProviderType): void {
      const providerFlag = this.settings.get_flags('data-providers');
      const providerTypes: Array<DataProviderType> = settingsFlagsToEnumList(providerFlag);
      const extensionsRow = new ListBoxRow({
        halign: Align.FILL,
        valign: Align.FILL,
        widthRequest: 100,
        activatable: true,
      });
      const rowContainer = new Box({
        marginTop: 24,
        marginBottom: 24,
        marginStart: 15,
        marginEnd: 15,
        widthRequest: 100,
        orientation: Orientation.HORIZONTAL,
      });

      const rowLabelContainer = new Box({
        orientation: Orientation.VERTICAL,
        halign: Align.FILL,
        valign: Align.FILL,
        hexpand: true,
        vexpand: true,
      });
      rowLabelContainer.append(
        new Label({
          label,
          halign: Align.START,
          valign: Align.FILL,
        }),
      );
      rowLabelContainer.append(
        new Label({
          label: description,
          halign: Align.START,
          valign: Align.FILL,
          cssClasses: ['dim-label', 'setting-description'],
        }),
      );
      const rowSwitch = new Switch({
        halign: Align.END,
        valign: Align.CENTER,
        active: providerTypes.find((providerType) => providerType === dataProviderType) !== undefined,
      });

      rowSwitch.connect('state-set', (_, state) => {
        let lastProviderFlag = this.settings.get_flags('data-providers');
        if (state === true) {
          lastProviderFlag += Math.pow(2, dataProviderType);
        } else {
          lastProviderFlag -= Math.pow(2, dataProviderType);
        }
        this.settings.set_flags('data-providers', lastProviderFlag);
      });

      rowContainer.append(rowLabelContainer);
      rowContainer.append(rowSwitch);

      extensionsRow.set_child(rowContainer);
      this.append(extensionsRow);
    }
  },
);
