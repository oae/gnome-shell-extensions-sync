import { parse } from 'fast-xml-parser';
import { File, Settings } from '@imports/Gio-2.0';
import { execute } from '../utils';
import { file_get_contents } from '@imports/GLib-2.0';
import { byteArray } from '@imports/Gjs';

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
const getExtensionIds = (): Array<string> => imports.ui.main.extensionManager.getUuids();

const readSchemaAsJson = (schemaPath: string): any => {
  const [, contents] = file_get_contents(schemaPath);

  return parse(byteArray.toString(contents), { ignoreAttributes: false });
};

const getExtensionById = (extensionId: string): ShellExtension => imports.ui.main.extensionManager.lookup(extensionId);

const getExtensionSchemas = (extensionId: string): any => {
  const extension = getExtensionById(extensionId);

  const { stdout } = execute(`find -L ${extension.path} -iname "*.xml" -exec grep -l "schemalist" {} +`);
  if (!stdout) {
    return {
      [extension.metadata.uuid]: {},
    };
  }

  const schemaFiles = stdout.trim().split('\n');

  const foundSchemas = schemaFiles
    .map((schemaFile) => readSchemaAsJson(schemaFile))
    .reduce((schemaJsonAcc, schemaJson) => {
      if (!schemaJson || !schemaJson.schemalist || !schemaJson.schemalist.schema) {
        return schemaJsonAcc;
      }

      const schema = schemaJson.schemalist.schema;

      if (Array.isArray(schema)) {
        const multipleSchemaObj = schema.reduce((acc, schemaObj) => {
          if (schemaObj['@_path'] && schemaObj['@_id']) {
            return {
              ...acc,
              [schemaObj['@_id']]: schemaObj['@_path'],
            };
          }
        }, {});

        return {
          ...multipleSchemaObj,
          ...schemaJsonAcc,
        };
      } else if (schema['@_path'] && schema['@_id']) {
        return {
          ...schemaJsonAcc,
          [schema['@_id']]: schema['@_path'],
        };
      }

      return schemaJsonAcc;
    }, {});

  return {
    [extension.metadata.uuid]: foundSchemas,
  };
};

export const getCurrentExtension = (): ShellExtension => imports.misc.extensionUtils.getCurrentExtension();

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();

export const getAllExtensions = (type: ExtensionType): Array<ShellExtension> => {
  const extensionIds = getExtensionIds();
  const extensions = extensionIds
    .map((id: string): any => {
      const extension = getExtensionById(id);
      if (extension.type === type) {
        return extension;
      }
      return undefined;
    })
    .filter((item) => item !== undefined);

  return extensions;
};

export const getAllExtensionSchemas = (): any => {
  const extensions = getAllExtensions(ExtensionType.PER_USER);

  return extensions.reduce((extensionAcc, extension) => {
    return {
      ...extensionAcc,
      ...getExtensionSchemas(extension.metadata.uuid),
    };
  }, {});
};

export const notify = (text: string): void => imports.ui.main.notify(text);
