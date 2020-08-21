import { DataProvider } from '@esync/data';
import { readDconfData, writeDconfData } from '@esync/shell';
import { logger } from '@esync/utils';

const debug = logger('tweaks-data-provider');

export type TweaksData = {
  [key: string]: string;
};

const tweaksSchemaList: Array<string> = [
  '/org/gnome/desktop/background/',
  '/org/gnome/desktop/calendar/',
  '/org/gnome/desktop/input-sources/',
  '/org/gnome/desktop/interface/',
  '/org/gnome/desktop/peripherals/',
  '/org/gnome/desktop/screensaver/',
  '/org/gnome/desktop/sound/',
  '/org/gnome/desktop/wm/preferences/',
  '/org/gnome/mutter/',
  '/org/gnome/settings-daemon/plugins/xsettings/',
];

export class TweaksDataProvider implements DataProvider {
  async getData(): Promise<TweaksData> {
    return tweaksSchemaList.reduce(async (acc, schema) => {
      try {
        return {
          ...(await acc),
          [schema]: await readDconfData(schema),
        };
      } catch (ex) {
        debug(`cannot dump settings for ${schema}`);
      }

      return acc;
    }, Promise.resolve({}));
  }

  async useData(tweaksData: TweaksData): Promise<void> {
    await Promise.all(
      Object.keys(tweaksData).map((schemaPath) => {
        return writeDconfData(schemaPath, tweaksData[schemaPath]);
      }),
    );
  }

  getName(): string {
    return 'tweaks';
  }
}
