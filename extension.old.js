// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

'use strict';

imports.searchPath.unshift(imports.misc.extensionUtils.getCurrentExtension().path);

imports.utils.globals;

const ExtensionSystem = imports.ui.extensionSystem;
const St = imports.gi.St;
const Main = imports.ui.main;
const { Button } = imports.ui.panelMenu;
const Gio = imports.gi.Gio;

const Config = imports.misc.config;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const { getSchemaIds, getExtensionState, getSettings } = imports.utils.sync;
const { setTimeout } = imports.utils.timer;
const { debug } = imports.utils.globals;
const { debounce } = imports.utils.lodash;

let text, button, extensionChangeHandler, syncIntervalId, settingsList = [];

function init() {

  button = new St.Bin({
    style_class: 'panel-button',
    reactive: true,
    can_focus: true,
    x_fill: true,
    y_fill: false,
    track_hover: true
  });
  let icon = new St.Icon({
    icon_name: 'system-run-symbolic',
    style_class: 'system-status-icon'
  });

  button.set_child(icon);
  button.connect('button-press-event', toggleMenu);
}

function toggleMenu(actor, event) {
  checkExtensions();
  discoverExtensions();
}

function discoverExtensions() {
  const extensions = ExtensionUtils.extensions;
  const syncData = Object.keys(extensions).map(extensionId => extensions[extensionId]).reduce((acc, extension) => {
    const metadata = extension.metadata;
    const schemaIds = getSchemaIds(extension);
    return Object.assign({}, acc, {
      [metadata.uuid]: { schemaIds, extension }
    });
  }, {});

  debug(JSON.stringify(Object.keys(syncData)));
}


function checkExtensions() {
  // debug('Syncing extensions');
  // settingsList.forEach(settings => {
  //   settings.settings.disconnect(settings.handler);
  // });
  // Object.keys(ExtensionUtils.extensions).forEach(uuid => {
  //   const extension = ExtensionUtils.extensions[uuid];
  //   const hasPrefs = extension.hasPrefs;
  //   if (hasPrefs) {
  //     try {
  //       const schemaIds = getSchemaIds(extension);
  //       schemaIds.forEach(schemaId => {
  //         const settings = getSettings(schemaId, extension);
  //         const handlerId = settings.connect('changed', settingsChanged);
  //         settingsList.push({
  //           handler: handlerId,
  //           settings: settings
  //         });
  //         debug(`dconf dump ${schemaId} > backup.conf`);
  //       });

  //     }
  //     catch (e) {
  //       debug(e);
  //     }
  //   }
  // });
}

function settingsChanged() {
  debug(`${JSON.stringify(arguments)}`);
}

function onStateChange(event, extension) {
  debug(`state of ${extension.metadata.name} changed to: ${getExtensionState(extension)}, discovering enabled extensions`);
  discoverExtensions();
}

function enable() {
  debug('Extension enabled');
  settingsList = [];
  Main.panel._rightBox.insert_child_at_index(button, 0);
  extensionChangeHandler = ExtensionSystem.connect('extension-state-changed', debounce(onStateChange, 1000));
  // setTimeout(checkExtensions, 5000);
}

function disable() {
  ExtensionSystem.disconnect(extensionChangeHandler);
  Main.panel._rightBox.remove_child(button);
  settingsList.forEach(settings => {
    settings.settings.disconnect(settings.handler);
  });
  settingsList = [];
}
