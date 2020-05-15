import { File, Settings } from '@imports/Gio-2.0';

export enum ExtensionType {
  SYSTEM = 1,
  PER_USER = 2,
}

export enum ExtensionState {
  ENABLED = 1,
  DISABLED = 2,
  ERROR = 3,
  OUT_OF_DATE = 4,
  DOWNLOADING = 5,
  INITIALIZED = 6,

  // Used as an error state for operations on unknown extensions,
  // should never be in a real extensionMeta object.
  UNINSTALLED = 99,
}

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
  state: ExtensionState;
  stateObj: any;
  stylesheet: File;
  type: ExtensionType;
  uuid: string;
}

export const getCurrentExtension = (): ShellExtension => imports.misc.extensionUtils.getCurrentExtension();

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();

export const canRestartShell = (): boolean => {
  return !imports.gi.Meta.is_wayland_compositor();
};

export const restartShell = (text: string): void => {
  if (!imports.gi.Meta.is_wayland_compositor()) {
    imports.gi.Meta.restart(text);
  }
};

export const notify = (text: string): void => imports.ui.main.notify(text);
