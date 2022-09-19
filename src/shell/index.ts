import { execute, logger } from '@esync/utils';
import { File, FileCreateFlags, file_new_tmp, Settings } from '@gi-types/gio2';
import { PRIORITY_DEFAULT } from '@gi-types/glib2';
import { is_wayland_compositor, restart } from '@gi-types/meta10';

const debug = logger('shell');

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
  return !is_wayland_compositor();
};

export const restartShell = (text: string): void => {
  if (!is_wayland_compositor()) {
    restart(text);
  }
};

export const notify = (text: string): void => {
  const settings = getCurrentExtensionSettings();
  const showNotifications = settings.get_boolean('show-notifications');
  if (showNotifications) {
    imports.ui.main.notify(text);
  } else {
    debug(`Notifications are hidden. Logging the content instead. Content: ${text}`);
  }
};

export const writeDconfData = async (schemaPath: string, data: string): Promise<void> => {
  if (!schemaPath || !data) {
    return;
  }
  const [file, ioStream] = file_new_tmp(null);
  file.replace_contents(imports.byteArray.fromString(data), null, false, FileCreateFlags.REPLACE_DESTINATION, null);
  try {
    await execute(`dconf load ${schemaPath} < ${file.get_path()}`);
    debug(`loaded settings for ${schemaPath}`);
  } catch (ex) {
    debug(`cannot load settings for ${schemaPath}`);
  }
  file.delete(null);
  ioStream.close_async(PRIORITY_DEFAULT, null);
};

export const readDconfData = async (schemaPath: string): Promise<string> => {
  return execute(`dconf dump ${schemaPath}`);
};

export const loadInterfaceXML = (iface: string): any => {
  const uri = `file:///${getCurrentExtension().path}/dbus/${iface}.xml`;
  const file = File.new_for_uri(uri);

  try {
    const [, bytes] = file.load_contents(null);
    return imports.byteArray.toString(bytes);
  } catch (e) {
    log(`Failed to load D-Bus interface ${iface}`);
  }

  return null;
};
