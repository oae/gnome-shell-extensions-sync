import { registerClass } from '@gi-types/gobject2';
import { Align, Box, Label, ListBoxRow, Orientation, Switch } from '@gi-types/gtk4';
import { PrefsTab } from '@esync/prefs/prefsTab';

export const OtherPrefs = registerClass(
  {},
  class OtherPrefs extends PrefsTab {
    _init() {
      super._init({
        title: 'Other Settings',
        orientation: Orientation.VERTICAL,
        marginTop: 24,
        marginBottom: 24,
        marginStart: 12,
        marginEnd: 12,
      });

      this.createShowTrayIconSetting();
      this.createShowNotificationsSetting();
    }

    createShowTrayIconSetting(): void {
      const showTrayIcon = this.settings.get_boolean('show-tray-icon');
      this.createSetting('Show Tray Icon', 'Controls the visibility of the tray icon.', showTrayIcon, (state) => {
        this.settings.set_boolean('show-tray-icon', state);
      });
    }

    createShowNotificationsSetting(): void {
      const showNotifications = this.settings.get_boolean('show-notifications');
      this.createSetting(
        'Show Notifications',
        'Controls the visibility of the notifications.',
        showNotifications,
        (state) => {
          this.settings.set_boolean('show-notifications', state);
        },
      );
    }

    createSetting(
      label: string,
      description: string,
      initialSwitchValue: boolean,
      onStateSet: (state: boolean) => void,
    ): void {
      const row = new ListBoxRow({
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
        active: initialSwitchValue,
      });

      rowSwitch.connect('state-set', (_, state) => {
        onStateSet(state);
      });

      rowContainer.append(rowLabelContainer);
      rowContainer.append(rowSwitch);

      row.set_child(rowContainer);
      this.append(row);
    }
  },
);
