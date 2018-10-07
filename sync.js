// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionDownloader = imports.ui.extensionDownloader;
const ExtensionUtils = imports.misc.extensionUtils;

const Signals = imports.signals;

const { Settings } = imports.settings;
const { Request } = imports.request;
const { debounce, logger, getExtensionState, setInterval, clearInterval, setTimeout } = imports.utils;

const GIST_API_URL = 'https://api.github.com/gists/6d2cfa2848b4e5e91ef181374b15c532';
const debug = logger('sync');


var Sync = class Sync {

  constructor() {
    this.stateChangeHandlerId = null;
    this.syncHandlerId = null;
    this.syncedExtensions = null;
    this.shouldOverride = true;
    this.checkIntervalId = null;
    this.request = new Request({
      auth: {
        user: 'notimportant',
        token: 'xxxxxxx',
        realm: 'Github Api',
        host: 'api.github.com'
      }
    });
    this.lastUpdatedAt = new Date();
  }

  enable() {
    debug('enabled');

    setTimeout(() => {
      this._initExtensions();
      this.stateChangeHandlerId = ExtensionSystem.connect(
        'extension-state-changed',
        debounce((event, extension) => this._onExtensionStateChanged(extension), 1000)
      );
    }, 3000);
    this.syncHandlerId = this.connect('extensions-sync', debounce(() => this._updateGist(), 2000));
    this.checkIntervalId = setInterval(() => this._updateLocal(), 5000);
  }

  disable() {
    debug('disabled');
    ExtensionSystem.disconnect(this.stateChangeHandlerId);
    this.stateChangeHandlerId = null;

    this.disconnect(this.syncHandlerId);
    this.syncHandlerId = null;

    clearInterval(this.checkIntervalId);
    this.checkIntervalId = null;

    if (this.syncedExtensions) {
      Object.keys(this.syncedExtensions).forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        syncedExtension.settings.stopWatching();
      });
    }
  }

  getSyncData() {
    if (!this.syncedExtensions) {
      return null;
    }

    const extensions = Object.keys(this.syncedExtensions).reduce((acc, extensionId) => {
      const syncedExtension = this.syncedExtensions[extensionId];

      return Object.assign({}, acc, {
        [extensionId]: syncedExtension.settings.getSyncData()
      })

    }, {});

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
      .filter(extension => extension.state === ExtensionSystem.ExtensionState.ENABLED)
      .reduce((acc, extension) => {

        const metadata = extension.metadata;
        const settings = new Settings(extension);
        settings.startWatching();

        return Object.assign({}, acc, {
          [metadata.uuid]: {
            extension,
            settings,
          }
        });

      }, {});

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
    debug(`state of ${extension.metadata.name} changed to: ${getExtensionState(extension)}`);
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

  async _updateGist() {
    debug('emitted sync event');

    const syncData = this.getSyncData();
    this.lastUpdatedAt = new Date(JSON.parse(syncData.files.syncSettings.content).lastUpdatedAt);

    const gistData = await this._getGistData();
    const shouldUpdateGist = this._shouldUpdateGist(gistData);

    if(shouldUpdateGist) {
      debug(`syncing ${Object.keys(this.syncedExtensions).length} extensions`);
      const { status } = await this.request.send({ url: GIST_API_URL, method: 'PATCH', data: syncData });
      debug(`synced extensions successfully. Status code: ${status}`);
    }
  }

  async _updateLocal() {
    debug('checking for updates');
    const { syncSettings, extensions } = await this._getGistData();
    const shouldUpdateLocal = this._shouldUpdateLocal({ syncSettings });

    if(shouldUpdateLocal) {
      this.lastUpdatedAt = new Date(syncSettings.lastUpdatedAt);

      this.disable();

      Object.keys(extensions).forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        if(syncedExtension) {
          syncedExtension.settings.update(extensions[extensionId]);
        }
        else {
          ExtensionDownloader.installExtension(extensionId);
          // TODO: Start watching newly installed extension
        }
      });

      this.enable();
    }
  }

  _shouldUpdateGist({ syncSettings }) {
    const serverlastUpdatedAt = new Date(syncSettings.lastUpdatedAt);

    return this.lastUpdatedAt && serverlastUpdatedAt < this.lastUpdatedAt;
  }

  _shouldUpdateLocal({ syncSettings }) {
    const serverlastUpdatedAt = new Date(syncSettings.lastUpdatedAt);

    return this.lastUpdatedAt && serverlastUpdatedAt > this.lastUpdatedAt;
  }

  async _getGistData() {
    const { data } = await this.request.send({ url: GIST_API_URL, method: 'GET'});

    const extensions = JSON.parse(data.files.extensions.content);
    const syncSettings = JSON.parse(data.files.syncSettings.content);

    return {
      syncSettings,
      extensions,
    }
  }
}

Signals.addSignalMethods(Sync.prototype);
