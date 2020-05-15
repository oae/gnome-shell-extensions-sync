// ➜ dconf dump /org/gnome/mutter/keybindings/ > mutter-keybindings.dconf
// ➜ dconf dump /org/gnome/desktop/wm/keybindings/ > wm-keybindings.dconf
// ➜ dconf dump /org/gnome/settings-daemon/plugins/media-keys/ > media-keys-keybindings.dconf
import { DataProvider } from '../';
import { logger } from '../../utils';

const debug = logger('keybindings-data-provider');

export type KeyBindingsData = {
  [key: string]: string;
};

export class KeyBindingsDataProvider implements DataProvider {
  async getData(): Promise<KeyBindingsData> {
    return {};
  }
  async useData(keyBindingsData: KeyBindingsData): Promise<void> {
    debug(`${keyBindingsData}`);
  }
  getName(): string {
    return 'keybindings';
  }
}
