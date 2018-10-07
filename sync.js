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
const { debounce, logger, setInterval, clearInterval, setTimeout } = imports.utils;

const GIST_API_URL = 'https://api.github.com/gists';
const BLACKLISTED_EXTENSIONS = ['extensions-sync@elhan.io'];
const debug = logger('sync');

var Sync = class Sync {

  constructor() {
    this.settings = getSettings('org.gnome.shell.extensions.sync');
    this.stateChangeHandlerId = null;
    this.syncHandlerId = null;
    this.syncedExtensions = null;
    this.shouldOverride = true;
    this.checkIntervalId = null;
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

    setTimeout(() => {
      this._initExtensions();
      this.stateChangeHandlerId = ExtensionSystem.connect(
        'extension-state-changed',
        debounce((event,extension) => this._onExtensionStateChanged(extension),1000)
      );
    },3000);
    this.syncHandlerId = this.connect('extensions-sync',debounce(() => this._updateGist(),2000));
    this.checkIntervalId = setInterval(() => this._updateLocal(),5000);
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
      .filter(extension => extension.state === ExtensionSystem.ExtensionState.ENABLED)
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
    if(BLACKLISTED_EXTENSIONS.indexOf(extension.metadata.uuid) >= 0) {
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

  async _updateGist() {
    debug('emitted sync event');

    const syncData = this.getSyncData();
    const gistData = await this._getGistData();

    const updateRequestDate = JSON.parse(syncData.files.syncSettings.content).lastUpdatedAt;
    const shouldUpdateGist = this._shouldUpdateGist(updateRequestDate, gistData.syncSettings.lastUpdatedAt);

    if (shouldUpdateGist) {
      debug(`syncing ${Object.keys(this.syncedExtensions).length} extensions`);
      const { status } = await this.request.send({ url: this._getGistUrl(), method: 'PATCH', data: syncData });

      if(status == '200') {
        this._setLastUpdatedAt(updateRequestDate);
        debug(`synced extensions successfully. Status code: ${status}`);
      }

    }
  }

  async _updateLocal() {
    debug('checking for updates');
    const { syncSettings,extensions } = await this._getGistData();
    const shouldUpdateLocal = this._shouldUpdateLocal(syncSettings.lastUpdatedAt);

    if (shouldUpdateLocal) {

      this.disable();

      this._setLastUpdatedAt(syncSettings.lastUpdatedAt);

      Object.keys(extensions).forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        if (syncedExtension) {
          syncedExtension.settings.update(extensions[extensionId]);
        }
        else {
          ExtensionDownloader.installExtension(extensionId);
        }
      });

      this.enable();
    }
  }

  _shouldUpdateGist(requestDate, serverDate) {
    const localLastUpdatedAt = this._getLastUpdatedAt();

    if(!localLastUpdatedAt && !serverDate) {
      return true;
    }
    else if(!localLastUpdatedAt || (localLastUpdatedAt && !serverDate)) {
      return false;
    }

    return new Date(requestDate) > new Date(serverDate);
  }

  _shouldUpdateLocal(serverDate) {

    const localLastUpdatedAt = this._getLastUpdatedAt();

    if(!localLastUpdatedAt && serverDate) {
      return true;
    }
    else if(localLastUpdatedAt && !serverDate) {
      return false;
    }

    return new Date(serverDate) > new Date(localLastUpdatedAt);
  }

  async _getGistData() {
    const { data } = await this.request.send({ url: this._getGistUrl(), method: 'GET' });
    let extensions;
    let syncSettings;
    try {
      extensions = JSON.parse(data.files.extensions.content);
    }
    catch(e) {
      extensions = {};
    }

    try {
      syncSettings = JSON.parse(data.files.syncSettings.content);
    }
    catch(e) {
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
