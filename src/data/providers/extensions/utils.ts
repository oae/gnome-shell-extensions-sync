import { ExtensionType, getCurrentExtension, readDconfData, ShellExtension } from '@esync/shell';
import { execute, logger } from '@esync/utils';
import { File, Subprocess, SubprocessFlags } from '@gi-types/gio2';
import { build_filenamev, file_get_contents, get_user_data_dir, PRIORITY_DEFAULT } from '@gi-types/glib2';
import { form_encode_hash, Message, Session, Status, status_get_phrase } from '@gi-types/soup3';
import { parse } from 'fast-xml-parser';

const debug = logger('extension-utils');

const readSchemaAsJson = (schemaPath: string): any => {
  const [, contents] = file_get_contents(schemaPath);

  return parse(imports.byteArray.toString(contents), { ignoreAttributes: false });
};

const getExtensionManager = (): any => imports.ui.main.extensionManager;

const getExtensionById = (extensionId: string): ShellExtension => getExtensionManager().lookup(extensionId);

const getExtensionSchemas = async (extensionId: string): Promise<any> => {
  const extension = getExtensionById(extensionId);
  let stdout: string;

  try {
    stdout = await execute(`find -L ${extension.path} -iname "*.xml" -exec grep -l "schemalist" {} +`);
  } catch (ex) {
    debug(`error occurred while getting extension schemas: ${ex}`);
    return {};
  }

  if (!stdout) {
    return {};
  }

  const schemaFiles: Array<string> = stdout.split('\n');

  const foundSchemas = schemaFiles
    .map((schemaFile) => readSchemaAsJson(schemaFile))
    .reduce((schemaJsonAcc, schemaJson) => {
      if (!schemaJson || !schemaJson.schemalist || !schemaJson.schemalist.schema) {
        return schemaJsonAcc;
      }

      const schema = schemaJson.schemalist.schema;

      if (Array.isArray(schema)) {
        const multipleSchemaObj = schema.reduce((acc, schemaObj) => {
          if (schemaObj['@_path']) {
            return {
              ...acc,
              [schemaObj['@_path']]: {},
            };
          }

          return acc;
        }, {});

        return {
          ...multipleSchemaObj,
          ...schemaJsonAcc,
        };
      } else if (schema['@_path']) {
        return {
          ...schemaJsonAcc,
          [schema['@_path']]: {},
        };
      }

      return schemaJsonAcc;
    }, {});

  return foundSchemas;
};

export const getExtensionIds = (): Array<string> =>
  getExtensionManager()
    .getUuids()
    .filter(
      (uuid: string) =>
        getExtensionById(uuid).type === ExtensionType.PER_USER && uuid !== getCurrentExtension().metadata.uuid,
    );

const getAllExtensions = (): Array<ShellExtension> => {
  const extensionIds = getExtensionIds();
  const extensions = extensionIds
    .map((id: string): any => {
      const extension = getExtensionById(id);
      if (extension.type === ExtensionType.PER_USER) {
        return extension;
      }
      return undefined;
    })
    .filter((item) => item !== undefined);

  return extensions;
};

const getExtensionConfigData = async (extensionId: string): Promise<any> => {
  const schemas = await getExtensionSchemas(extensionId);

  return Object.keys(schemas).reduce(async (acc, schema) => {
    try {
      return {
        ...(await acc),
        [schema]: await readDconfData(schema),
      };
    } catch (ex) {
      debug(`cannot dump settings for ${extensionId}:${schema}`);
    }

    return acc;
  }, Promise.resolve({}));
};

export const getAllExtensionConfigData = async (): Promise<any> => {
  const extensions = getAllExtensions();

  return extensions.reduce(async (extensionAcc, extension) => {
    return {
      ...(await extensionAcc),
      [extension.metadata.uuid]: await getExtensionConfigData(extension.metadata.uuid),
    };
  }, Promise.resolve({}));
};

export const removeExtension = (extensionId: string): void => {
  imports.ui.extensionDownloader.uninstallExtension(extensionId);
  debug(`removed extension ${extensionId}`);
};

const extractExtensionArchive = async (bytes, dir) => {
  if (!dir.query_exists(null)) {
    dir.make_directory_with_parents(null);
  }

  const [file, stream] = File.new_tmp('XXXXXX.shell-extension.zip');
  await stream.output_stream.write_bytes_async(bytes, PRIORITY_DEFAULT, null);
  stream.close_async(PRIORITY_DEFAULT, null);

  const unzip = Subprocess.new(['unzip', '-uod', dir.get_path(), '--', file.get_path()], SubprocessFlags.NONE);
  await unzip.wait_check_async(null);
};

export const installExtension = async (extensionId: string): Promise<void> => {
  const params = { shell_version: imports.misc.config.PACKAGE_VERSION };
  const message = Message.new_from_encoded_form(
    'GET',
    `https://extensions.gnome.org/download-extension/${extensionId}.shell-extension.zip`,
    form_encode_hash(params),
  );

  const dir = File.new_for_path(build_filenamev([get_user_data_dir(), 'gnome-shell', 'extensions', extensionId]));

  try {
    const bytes = await new Session().send_and_read_async(message, PRIORITY_DEFAULT, null);
    const { statusCode } = message;
    const phrase = status_get_phrase(statusCode);
    if (statusCode !== Status.OK) throw new Error(`Unexpected response: ${phrase}`);

    await extractExtensionArchive(bytes, dir);

    const extension = getExtensionManager().createExtensionObject(extensionId, dir, ExtensionType.PER_USER);
    getExtensionManager().loadExtension(extension);
    if (!getExtensionManager().enableExtension(extensionId)) {
      throw new Error(`Cannot enable ${extensionId}`);
    }
  } catch (e) {
    debug(`error occurred during installation of ${extensionId}. Error: ${e}`);
  }
};
