// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

imports.searchPath.unshift(imports.misc.extensionUtils.getCurrentExtension().path);

const Main = imports.ui.main;

const { Sync } = imports.sync;
const { StatusMenu } = imports.statusMenu;

let sync;
let statusMenu;
function init() {
  sync = new Sync();
  window.sync = sync;
}

function enable() {
  sync.enable();
  statusMenu = new StatusMenu();
  statusMenu.enable();
}

function disable() {
  sync.disable();
  statusMenu.disable();
}
