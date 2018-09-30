// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

const Signals = imports.signals;

const { Settings } = imports.settings;
const { debounce, debug, getExtensionState } = imports.utils;

class Sync {

  constructor() {
    this.stateChangeHandlerId = null;
    this.syncHandlerId = null;
    this.syncedExtensions = null;
  }

  enable() {
    debug('[sync] enabled');
    this._initExtensions();

    this.stateChangeHandlerId = ExtensionSystem.connect(
      'extension-state-changed',
      debounce((event, extension) => this._onExtensionStateChanged(extension), 1000)
    );
    this.syncHandlerId = this.connect('extensions-sync', this._sync.bind(this));

  }

  disable() {
    debug('[sync] disabled');
    ExtensionSystem.disconnect(this.stateChangeHandlerId);
    this.stateChangeHandlerId = null;

    this.disconnect(this.syncHandlerId);
    this.syncHandlerId = null;

    if(this.syncedExtensions) {
      Object.keys(this.syncedExtensions).forEach(extensionId => {
        const syncedExtension = this.syncedExtensions[extensionId];
        syncedExtension.settings.stopWatching();
      });
    }

    this.syncedExtensions = null;
  }

  _sync() {
    debug('[sync] emitted sync event');
    debug(`[sync] syncing ${Object.keys(this.syncedExtensions).length} extensions: ${Object.keys(this.syncedExtensions)}`);
  }

  _onExtensionStateChanged(extension) {
    debug(`[sync] state of ${extension.metadata.name} changed to: ${getExtensionState(extension)}`);
    switch(extension.state) {
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
    debug(`[sync] started watching extension: ${extension.metadata.name}`);

    const settings = new Settings(extension);
    settings.startWatching();

    this.syncedExtensions[extension.metadata.uuid] = {
      extension,
      settings,
    };

    this.emit('extensions-sync');
  }

  _stopWatching(extension) {
    debug(`[sync] stopped watching extension: ${extension.metadata.name}`);

    const syncedExtension = this.syncedExtensions[extension.metadata.uuid];
    delete this.syncedExtensions[extension.metadata.uuid];

    syncedExtension.settings.stopWatching();

    this.emit('extensions-sync');
  }
}


Signals.addSignalMethods(Sync.prototype);
