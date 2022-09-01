import { logger } from '@esync/utils';
import { registerClass } from '@gi-types/gobject2';
import { BaselinePosition, Box, Notebook, Orientation } from '@gi-types/gtk4';
import { OtherPrefs } from '@esync/prefs/otherPrefs';
import { ProviderPrefs } from '@esync/prefs/providerPrefs';
import { SyncedDataPrefs } from '@esync/prefs/syncedDataPrefs';

const debug = logger('prefs');

const Preferences = registerClass(
  {},
  class Preferences extends Box {
    _init() {
      super._init({
        orientation: Orientation.VERTICAL,
        spacing: 10,
        baselinePosition: BaselinePosition.BOTTOM,
      });

      this.createNotebook();
    }

    createNotebook() {
      const notebook = new Notebook({
        hexpand: true,
        vexpand: true,
      });

      const providerPrefs = new ProviderPrefs();
      providerPrefs.attach(notebook);

      const syncedDataSettings = new SyncedDataPrefs();
      syncedDataSettings.attach(notebook);

      const otherSettings = new OtherPrefs();
      otherSettings.attach(notebook);

      this.append(notebook);
    }
  },
);

const init = (): void => debug('prefs initialized');

const buildPrefsWidget = (): any => new Preferences();

export default { init, buildPrefsWidget };
