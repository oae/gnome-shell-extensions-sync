// Copyright (C) 2018 O. Alperen Elhan
//
// This file is part of Extensions Sync.
//
// Extensions Sync is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// Extensions Sync is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Extensions Sync.  If not, see <http://www.gnu.org/licenses/>.
//

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionDownloader = imports.ui.extensionDownloader;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;

const { Settings } = extensionsSync.imports.settings;
const { getSettings } = extensionsSync.imports.convenience;
const { Request } = extensionsSync.imports.request;
const { debounce, logger, setTimeout, clearTimeout, diff } = extensionsSync.imports.utils;

const GIST_API_URL = 'https://api.github.com/gists';
const BLACKLISTED_EXTENSIONS = ['extensions-sync@elhan.io'];

const debug = logger('sync');

var Sync = class Sync {

  constructor() {
    this.settings = getSettings('org.gnome.shell.extensions.sync');
    this.stateChangeHandlerId = null;
    this.initializeHandlerId = null;
    this.syncedExtensions = null;
    this.shouldOverride = true;
  }

  enable() {
    debug('enabled');

    this._initExtensions();

    this.initializeHandlerId = setTimeout(() => {
      this.stateChangeHandlerId = (Main.extensionManager || ExtensionSystem).connect(
        'extension-state-changed',
        debounce((event,extension) => this._onExtensionStateChanged(extension),1000)
      );
    }, 3000);
  }

  disable() {
    debug('disabled');

    (Main.extensionManager || ExtensionSystem).disconnect(this.stateChangeHandlerId);
    this.stateChangeHandlerId = null;

    clearTimeout(this.initializeHandlerId);
    this.initializeHandlerId = null;

    if (this.syncedExtensions) {
      Object.keys(this.syncedExtensions).forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        syncedExtension.settings.stopWatching();
      });
    }
  }

  async updateGist() {
    debug(`syncing ${Object.keys(this.syncedExtensions).length} extensions`);

    const syncData = this.getSyncData();

    const { status } = await this._getRequest().send({ url: this._getGistUrl(), method: 'PATCH', data: syncData });

    if (status != 200) {
      debug(`Failed to update gist. Status code: ${status}`);
      return;
    }

    debug(`Updated gist successfully. Status code: ${status}`);
  }

  async updateLocal() {
    this.disable();

    debug('checking for updates');

    const gistData = await this._getGistData();

    if (!gistData) {
      debug('cannot get extension settings from gist. Check your connection.');
      this.enable();
      return;
    }

    const { extensions } = gistData;

    const toBeRemoved = diff(Object.keys(this.syncedExtensions), Object.keys(extensions));
    const toBeInstalled = diff(Object.keys(extensions), Object.keys(this.syncedExtensions));
    const toBeUpdated = diff(Object.keys(extensions), toBeInstalled);

    debug(`Extensions to be removed: ${JSON.stringify(toBeRemoved)}`);
    debug(`Extensions to be installed: ${JSON.stringify(toBeInstalled)}`);
    debug(`Extensions to be updated: ${JSON.stringify(toBeUpdated)}`);

    toBeRemoved.forEach(extensionId => ExtensionDownloader.uninstallExtension(extensionId));
    toBeUpdated.forEach(extensionId => {
      const syncedExtension = this.syncedExtensions[extensionId];
      syncedExtension.settings.update(extensions[extensionId]);
    });

    const promises = toBeInstalled.map(extensionId => new Promise((resolve, reject) => {
      ExtensionDownloader.installExtension(extensionId, {
        return_value(variant) {
          const [ state ] = variant.deep_unpack();
          if(state === 'successful') {
            debug(`extension ${extensionId} installed successfully`);
            const extension = ExtensionUtils.extensions[extensionId];
            const settings = new Settings(extension);
            settings.update(extensions[extensionId]);
          }

          resolve();
        },
        return_dbus_error(_, error) {
          debug(`error occured when installing extension ${extensionId}. error: ${error}`);
          resolve();
        }
      });
    }));
    Promise.all(promises).then(() => this.enable());
  }

  getSyncData() {
    if (!this.syncedExtensions) {
      return null;
    }

    const extensions = Object.keys(this.syncedExtensions).reduce((acc,extensionId) => {
      const syncedExtension = this.syncedExtensions[extensionId];

      return Object.assign({},acc,{
        [extensionId]: syncedExtension.settings.getSyncData()
      })

    },{});

    return {
      description: 'Extensions sync',
      files: {
        syncSettings: {
          content: JSON.stringify({
            lastUpdatedAt: new Date(),
          })
        },
        extensions: {
          content: JSON.stringify(extensions)
        },
      },
    };
  }

  _initExtensions() {
    this.syncedExtensions = (Main.extensionManager.getUuids() || Object.keys(ExtensionUtils.extensions))
      .map(extensionId => (Main.extensionManager.lookup(extensionId) || ExtensionUtils.extensions[extensionId]))
      .filter(extension => extension.metadata && BLACKLISTED_EXTENSIONS.indexOf(extension.metadata.uuid) < 0)
      .reduce((acc,extension) => {

        const metadata = extension.metadata;
        const settings = new Settings(extension);
        settings.startWatching();

        return Object.assign({},acc,{
          [metadata.uuid]: {
            extension,
            settings,
          }
        });

      },{});
  }

  _startWatching(extension) {
    debug(`started watching extension: ${extension.metadata.name}`);

    const settings = new Settings(extension);
    settings.startWatching();

    this.syncedExtensions[extension.metadata.uuid] = {
      extension,
      settings,
    };
  }

  _stopWatching(extension) {
    debug(`stopped watching extension: ${extension.metadata.name}`);

    const syncedExtension = this.syncedExtensions[extension.metadata.uuid];
    delete this.syncedExtensions[extension.metadata.uuid];

    syncedExtension.settings.stopWatching();
  }

  _onExtensionStateChanged(extension) {

    if (!extension.metadata || BLACKLISTED_EXTENSIONS.indexOf(extension.metadata.uuid) >= 0) {
      return;
    }

    debug(`state of ${extension.metadata.name} changed to: ${this._getExtensionState(extension)}`);
    switch (extension.state) {
      case ExtensionSystem.ExtensionState.ENABLED: {
        this._startWatching(extension);
        break;
      }
      default: {
        this._stopWatching(extension)
        break;
      }
    }
  }

  async _getGistData() {
    const { data,status } = await this._getRequest().send({ url: this._getGistUrl(),method: 'GET' });
    if (status != 200) {
      return null;
    }

    let extensions;
    let syncSettings;
    try {
      extensions = JSON.parse(data.files.extensions.content);
      syncSettings = JSON.parse(data.files.syncSettings.content);
    }
    catch (e) {
      extensions = {};
      syncSettings = {};
    }

    return {
      syncSettings,
      extensions,
    }
  }

  _getRequest() {
    return new Request({
      auth: {
        user: 'notimportant',
        token: `${this._getGistToken()}`,
        realm: 'Github Api',
        host: 'api.github.com'
      }
    });
  }

  _getLastUpdatedAt() {
    return this.settings.get_string('last-updated-at');
  }

  _setLastUpdatedAt(date) {
    this.settings.set_string('last-updated-at', date);
  }

  _getGistUrl() {
    return `${GIST_API_URL}/${this._getGistId()}`
  }

  _getGistId() {
    return this.settings.get_string('gist-id');
  }

  _getGistToken() {
    return this.settings.get_string('gist-token');
  }

  _getExtensionState(extension) {
    switch (extension.state) {
      case ExtensionSystem.ExtensionState.ENABLED:
        return "Enabled";
      case ExtensionSystem.ExtensionState.DISABLED:
      case ExtensionSystem.ExtensionState.INITIALIZED:
        return "Disabled";
      case ExtensionSystem.ExtensionState.ERROR:
        return "Error";
      case ExtensionSystem.ExtensionState.OUT_OF_DATE:
        return "Out of date";
      case ExtensionSystem.ExtensionState.DOWNLOADING:
        return "Downloading";
      default:
        return 'Unknown';
    }
  };
}
