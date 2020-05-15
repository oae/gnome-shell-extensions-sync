import { parse } from 'fast-xml-parser';

import { File } from '@imports/Gio-2.0';
import {
  file_get_contents,
  spawn_async,
  SpawnFlags,
  child_watch_add,
  PRIORITY_DEFAULT,
  spawn_close_pid,
  build_filenamev,
  get_user_data_dir,
} from '@imports/GLib-2.0';
import { byteArray } from '@imports/Gjs';
import {
  KnownStatusCode,
  form_request_new_from_hash,
  SessionAsync,
  ProxyResolverDefault,
  Session,
} from '@imports/Soup-2.4';

import { execute, logger } from '../../../utils';
import { ShellExtension, ExtensionType, getCurrentExtension, readDconfData } from '../../../shell';

const debug = logger('extension-utils');

const readSchemaAsJson = (schemaPath: string): any => {
  const [, contents] = file_get_contents(schemaPath);

  return parse(byteArray.toString(contents), { ignoreAttributes: false });
};

const getExtensionManager = (): any => imports.ui.main.extensionManager;

const getExtensionById = (extensionId: string): ShellExtension => getExtensionManager().lookup(extensionId);

const getExtensionSchemas = async (extensionId: string): Promise<any> => {
  const extension = getExtensionById(extensionId);
  let stdout: string;

  try {
    stdout = await execute(`find -L ${extension.path} -iname "*.xml" -exec grep -l "schemalist" {} +`);
  } catch (ex) {
    debug(`error occured while getting extension schemas: ${ex}`);
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

const gotExtensionZipFile = (session, message, uuid, dir, callback, errback): any => {
  if (message.status_code != KnownStatusCode.OK) {
    errback('DownloadExtensionError', message.status_code);
    return;
  }

  try {
    if (!dir.query_exists(null)) dir.make_directory_with_parents(null);
  } catch (e) {
    errback('CreateExtensionDirectoryError', e);
    return;
  }

  const [file, stream] = File.new_tmp('XXXXXX.shell-extension.zip');
  const contents = message.response_body.flatten().get_as_bytes();
  stream.output_stream.write_bytes(contents, null);
  stream.close(null);
  const [success, pid] = spawn_async(
    null,
    ['unzip', '-uod', dir.get_path(), '--', file.get_path()],
    null,
    SpawnFlags.SEARCH_PATH | SpawnFlags.DO_NOT_REAP_CHILD,
    null,
  );

  if (!success) {
    errback('ExtractExtensionError');
    return;
  }
  if (pid) {
    child_watch_add(PRIORITY_DEFAULT, pid, (o, status) => {
      spawn_close_pid(pid);

      if (status != 0) errback('ExtractExtensionError');
      else callback();
    });
  }
};

export const installExtension = async (extensionId: string): Promise<void> => {
  return new Promise((resolve) => {
    const params = { shell_version: imports.misc.config.PACKAGE_VERSION };

    const url = `https://extensions.gnome.org/download-extension/${extensionId}.shell-extension.zip`;
    const message = form_request_new_from_hash('GET', url, params);

    const dir = File.new_for_path(
      build_filenamev([build_filenamev([get_user_data_dir(), 'gnome-shell']), 'extensions', extensionId]),
    );

    const callback = (): any => {
      try {
        const extension = getExtensionManager().createExtensionObject(
          extensionId,
          dir,
          imports.misc.extensionUtils.ExtensionType.PER_USER,
        );
        debug(`installed new extension ${extensionId}`);
        getExtensionManager().loadExtension(extension);
        if (!getExtensionManager().enableExtension(extensionId))
          throw new Error(`Cannot add ${extensionId} to enabled extensions gsettings key`);
      } catch (e) {
        removeExtension(extensionId);
        resolve();
        return;
      }

      resolve();
    };

    const _httpSession = new SessionAsync({ ssl_use_system_ca_file: true });

    Session.prototype.add_feature.call(_httpSession, new ProxyResolverDefault());

    _httpSession.queue_message(message, (session) => {
      gotExtensionZipFile(session, message, extensionId, dir, callback, resolve);
    });
  });
};
