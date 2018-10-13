// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionDownloader = imports.ui.extensionDownloader;
const ExtensionUtils = imports.misc.extensionUtils;

const Signals = imports.signals;

const { Settings } = imports.settings;
const { getSettings } = imports.convenience;
const { Request } = imports.request;
const { debounce, logger, setTimeout, clearTimeout } = imports.utils;

const GIST_API_URL = 'https://api.github.com/gists';
const BLACKLISTED_EXTENSIONS = ['extensions-sync@elhan.io'];

Array.prototype.diff = function (array) { return this.filter(i => array.indexOf(i) < 0) };

const debug = logger('sync');

var Sync = class Sync {

  constructor() {
    this.settings = getSettings('org.gnome.shell.extensions.sync');
    this.stateChangeHandlerId = null;
    this.initializeHandlerId = null;
    this.syncedExtensions = null;
    this.shouldOverride = true;
    this.request = new Request({
      auth: {
        user: 'notimportant',
        token: `${this._getGistToken()}`,
        realm: 'Github Api',
        host: 'api.github.com'
      }
    });
  }

  enable() {
    debug('enabled');

    this.initializeHandlerId = setTimeout(() => {
      this._initExtensions();
      this.stateChangeHandlerId = ExtensionSystem.connect(
        'extension-state-changed',
        debounce((event,extension) => this._onExtensionStateChanged(extension),3000)
      );
    }, 3000);
  }

  disable() {
    debug('disabled');
    ExtensionSystem.disconnect(this.stateChangeHandlerId);
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
    debug('emitted sync event');
    debug(`syncing ${Object.keys(this.syncedExtensions).length} extensions`);

    const syncData = this.getSyncData();

    const { status } = await this.request.send({ url: this._getGistUrl(), method: 'PATCH', data: syncData });

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

    const toBeRemoved = Object.keys(this.syncedExtensions).diff(Object.keys(extensions));
    const toBeInstalled = Object.keys(extensions).diff(Object.keys(this.syncedExtensions));
    const toBeUpdated = Object.keys(extensions).diff(toBeInstalled);

    debug(`Extensions to be removed: ${JSON.stringify(toBeRemoved)}`);
    debug(`Extensions to be installed: ${JSON.stringify(toBeInstalled)}`);
    debug(`Extensions to be updated: ${JSON.stringify(toBeUpdated)}`);

    toBeRemoved.forEach(extensionId => ExtensionDownloader.uninstallExtension(extensionId));
    toBeUpdated.forEach(extensionId => {
      const syncedExtension = this.syncedExtensions[extensionId];
      syncedExtension.settings.update(extensions[extensionId]);
    });

    toBeInstalled.forEach(extensionId => ExtensionDownloader.installExtension(extensionId));

    setTimeout(() => {
      toBeInstalled.forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        if(syncedExtension) {
          syncedExtension.settings.update(extensions[extensionId]);
        }
      });
      this.enable();
    }, 15000);
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
    this.syncedExtensions = Object.keys(ExtensionUtils.extensions)
      .map(extensionId => ExtensionUtils.extensions[extensionId])
      .filter(extension => BLACKLISTED_EXTENSIONS.indexOf(extension.metadata.uuid) < 0)
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

    this.emit('extensions-sync');
  }

  _startWatching(extension) {
    debug(`started watching extension: ${extension.metadata.name}`);

    const settings = new Settings(extension);
    settings.startWatching();

    this.syncedExtensions[extension.metadata.uuid] = {
      extension,
      settings,
    };

    this.emit('extensions-sync');
  }

  _stopWatching(extension) {
    debug(`stopped watching extension: ${extension.metadata.name}`);

    const syncedExtension = this.syncedExtensions[extension.metadata.uuid];
    delete this.syncedExtensions[extension.metadata.uuid];

    syncedExtension.settings.stopWatching();

    this.emit('extensions-sync');
  }

  _onExtensionStateChanged(extension) {

    if (BLACKLISTED_EXTENSIONS.indexOf(extension.metadata.uuid) >= 0) {
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
    const { data,status } = await this.request.send({ url: this._getGistUrl(),method: 'GET' });
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

Signals.addSignalMethods(Sync.prototype);
