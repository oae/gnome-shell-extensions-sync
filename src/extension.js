"use strict";
/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
exports.__esModule = true;
/* exported init */
var debug_1 = require("./debug");
require("./stylesheet.scss");
require("./metadata.json");
var Extension = /** @class */ (function () {
    function Extension() {
    }
    Extension.prototype.enable = function () {
        debug_1.debug('-------------------enabled-------------------');
    };
    Extension.prototype.disable = function () {
        debug_1.debug('-------------------disabled-------------------');
    };
    return Extension;
}());
function init() {
    return new Extension();
}
