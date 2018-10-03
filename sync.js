// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

const Signals = imports.signals;

const { Settings } = imports.settings;
const { Request } = imports.request;
const { debounce, logger, getExtensionState, setInterval, clearInterval } = imports.utils;

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
    this.lastUpdatedAt = null;
  }

  enable() {
    debug('enabled');
    this._initExtensions();

    this.stateChangeHandlerId = ExtensionSystem.connect(
      'extension-state-changed',
      debounce((event, extension) => this._onExtensionStateChanged(extension), 1000)
    );
    this.syncHandlerId = this.connect('extensions-sync', debounce(() => this._sync(), 2000));
    this.checkIntervalId = setInterval(() => this._checkForUpdates(), 5000);
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

    this.syncedExtensions = null;
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

  _sync() {
    debug('emitted sync event');
    debug(`syncing ${Object.keys(this.syncedExtensions).length} extensions: ${Object.keys(this.syncedExtensions)}`);

    const syncData = this.getSyncData();
    this.lastUpdatedAt = JSON.parse(syncData.files.syncSettings.content).lastUpdatedAt;

    this.request.send({
      url: GIST_API_URL,
      method: 'PATCH',
      data: syncData,
      onComplete: (status, data) => {
        debug(`synced extensions successfully. Status code: ${status}`);
      }
    });
  }

  _onExtensionStateChanged(extension) {
    debug(`state of ${extension.metadata.name} changed to: ${getExtensionState(extension)}`);
    switch (extension.state) {
      case ExtensionSystem.ExtensionState.ENABLED: {
        this._startWatching(extension);
        break;
      }
      // case ExtensionSystem.ExtensionState.ERROR:
      // case ExtensionSystem.ExtensionState.OUT_OF_DATE:
      // case ExtensionSystem.ExtensionState.DOWNLOADING:
      // case ExtensionSystem.ExtensionState.DISABLED:
      // case ExtensionSystem.ExtensionState.INITIALIZED:
      default: {
        this._stopWatching(extension)
        break;
      }
    }
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

  _checkForUpdates() {
    if(!this.shouldOverride) {
      debug('checking for updates');
    }

    this.request.send({
      url: GIST_API_URL,
      method: 'GET',
      onComplete: (status, dataStr) => {
        debug(`checked for updates. Status code: ${status}`);

        const data = JSON.parse(dataStr);
        const serverlastUpdatedAt = new Date(JSON.parse(data.files.syncSettings.content).lastUpdatedAt);
        const clientlastUpdatedAt = new Date(this.lastUpdatedAt);

        if(!this.lastUpdatedAt || serverlastUpdatedAt > clientlastUpdatedAt ) {
          this.lastUpdatedAt = serverlastUpdatedAt;
          debug('update found');
        }
        else {
          debug('There are no updates');
        }
      }
    });
  }
}


Signals.addSignalMethods(Sync.prototype);
