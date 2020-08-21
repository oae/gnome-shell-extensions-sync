import { DataProvider } from '@esync/data';
import { readDconfData, writeDconfData } from '@esync/shell';
import { logger } from '@esync/utils';

const debug = logger('keybindings-data-provider');

export type KeyBindingsData = {
  [key: string]: string;
};

const keyBindingsSchemaList: Array<string> = [
  '/org/gnome/mutter/keybindings/',
  '/org/gnome/mutter/wayland/keybindings/',
  '/org/gnome/desktop/wm/keybindings/',
  '/org/gnome/settings-daemon/plugins/media-keys/',
];

export class KeyBindingsDataProvider implements DataProvider {
  async getData(): Promise<KeyBindingsData> {
    return keyBindingsSchemaList.reduce(async (acc, schema) => {
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

  async useData(keyBindingsData: KeyBindingsData): Promise<void> {
    await Promise.all(
      Object.keys(keyBindingsData).map((schemaPath) => {
        return writeDconfData(schemaPath, keyBindingsData[schemaPath]);
      }),
    );
  }

  getName(): string {
    return 'keybindings';
  }
}
