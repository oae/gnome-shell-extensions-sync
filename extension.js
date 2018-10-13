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

imports.searchPath.unshift(imports.misc.extensionUtils.getCurrentExtension().path);

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
