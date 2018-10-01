// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT


imports.searchPath.unshift(imports.misc.extensionUtils.getCurrentExtension().path);

const { Sync } = imports.sync;

let sync;
function init() {
  sync = new Sync();
  window.sync = sync;
}

function enable() {
  sync.enable();
}

function disable() {
  sync.disable();
}
