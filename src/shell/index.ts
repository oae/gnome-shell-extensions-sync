import { File, Settings } from '@imports/Gio-2.0';
export interface ShellExtension {
  canChange: boolean;
  dir: File;
  error: any;
  hasPrefs: boolean;
  hasUpdate: boolean;
  imports: any;
  metadata: {
    name: string;
    description: string;
    uuid: string;
    'settings-schema': string;
    'shell-version': Array<string>;
  };
  path: string;
  state: number;
  stateObj: any;
  stylesheet: File;
  type: number;
  uuid: string;
}

export const getCurrentExtension = (): ShellExtension => imports.misc.extensionUtils.getCurrentExtension();

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();

export const notify = (text: string): void => imports.ui.main.notify(text);
