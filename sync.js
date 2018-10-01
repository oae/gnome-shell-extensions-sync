// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

const Signals = imports.signals;

const { Settings } = imports.settings;
const { debounce, logger, getExtensionState } = imports.utils;

const debug = logger('sync');

const GIST_API_URL = 'https://api.github.com/gists/6d2cfa2848b4e5e91ef181374b15c532';
const Lang = imports.lang;
const Soup = imports.gi.Soup;

let _session = new Soup.SessionAsync({ user_agent: 'Mozilla/5.0' });
var Sync = class Sync {

  constructor() {
    this.stateChangeHandlerId = null;
    this.syncHandlerId = null;
    this.syncedExtensions = null;
  }

  enable() {
    debug('enabled');
    this._initExtensions();

    this.stateChangeHandlerId = ExtensionSystem.connect(
      'extension-state-changed',
      debounce((event, extension) => this._onExtensionStateChanged(extension), 1000)
    );
    this.syncHandlerId = this.connect('extensions-sync', this._sync.bind(this));

  }

  disable() {
    debug('disabled');
    ExtensionSystem.disconnect(this.stateChangeHandlerId);
    this.stateChangeHandlerId = null;

    this.disconnect(this.syncHandlerId);
    this.syncHandlerId = null;

    if (this.syncedExtensions) {
      Object.keys(this.syncedExtensions).forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        syncedExtension.settings.stopWatching();
      });
    }

    this.syncedExtensions = null;
  }

  _sync() {
    debug('emitted sync event');
    debug(`syncing ${Object.keys(this.syncedExtensions).length} extensions: ${Object.keys(this.syncedExtensions)}`);

    const syncData = this.getSyncData();
    this.sendRequest(GIST_API_URL, syncData, (code, data) => {
      debug(`synced extensions successfully. Status code: ${code}`);
    });
  }

  sendRequest(url, params, callback) {
    let _params = JSON.stringify(params);

    let authUri = new Soup.URI(url);
    authUri.set_user('xxxxxxxxxxxxxxxx');
    authUri.set_password('xxxxxxxxxxxxxxxx');
    let message = new Soup.Message({method: 'PATCH', uri: authUri});
    message.set_request('application/json', Soup.MemoryUse.COPY, _params);

    let auth = new Soup.AuthBasic({host: 'api.github.com', realm: 'Github Api'});
    let authManager = new Soup.AuthManager();
    authManager.use_auth(authUri, auth);
    Soup.Session.prototype.add_feature.call(_session, authManager);
    _session.queue_message(message, Lang.bind(this,
      function (session, response) {
        callback(response.status_code, message.response_body.data);
      }
    ));
  }

  _onExtensionStateChanged(extension) {
    debug(`state of ${extension.metadata.name} changed to: ${getExtensionState(extension)}`);
    switch (extension.state) {
      case ExtensionSystem.ExtensionState.ENABLED: {
        this._startWatching(extension);
        break;
      }
      case ExtensionSystem.ExtensionState.DISABLED:
      case ExtensionSystem.ExtensionState.INITIALIZED:
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
            lastUpload: new Date(),
          })
        },
        extensions: {
          content: JSON.stringify(extensions)
        },
      },
    };

  }
}


Signals.addSignalMethods(Sync.prototype);
