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

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ByteArray = imports.byteArray;

const xmlParser = imports.utils.xmlParser;
const logger = imports.utils.logger;

const debug = logger('settings');

var Settings = class Settings {

  constructor(extension) {
    this.extension = extension;
    this.schemaList = {};
    this._initSchemaList();
  }

  getSyncData() {
    const syncData = Object.keys(this.schemaList).reduce((acc, schemaId) => {
      const schema = this.schemaList[schemaId];
      return Object.assign({}, acc, {
        [schemaId]: schema.data,
      });
    }, {});

    return syncData;
  }

  update(schemaData) {

    Object.keys(schemaData).forEach(schemaId => {
      debug(`updating schemaId: ${schemaId}`);
      const schema = this.schemaList[schemaId];
      const gSettings = schema.gSettings;

      const newData = schemaData[schemaId];

      this._setSchemaDataToDconf({
        gSettings,
        newData
      });
    });

  }

  startWatching() {

    Object.keys(this.schemaList).forEach(schemaId => {
      const schema = this.schemaList[schemaId];
      this.schemaList[schemaId].data = this._getSchemaDataFromDconf(schema.gSettings);
      this.schemaList[schemaId].changeHandlerId = schema.gSettings.connect('changed', () => {
        this._onSettingsChanged(schema);
      });
    });

    debug(`started watching changes for ${this.extension.metadata.name}`);
  }

  stopWatching() {

    Object.keys(this.schemaList).forEach(schemaId => {
      const schema = this.schemaList[schemaId];
      if(schema.changeHandlerId) {
        schema.gSettings.disconnect(schema.changeHandlerId);
        schema.changeHandlerId = null;
        schema.data = null;
        debug(`disconnected from ${schemaId}`);
      }
    });

    debug(`stopped watching changes for ${this.extension.metadata.name}`);
  }

  _onSettingsChanged(schema) {
    debug(`extension ${this.extension.metadata.name} is modified. emitting sync event`);
    schema.data = this._getSchemaDataFromDconf(schema.gSettings);
    sync.emit('extensions-sync');
  }

  _initSchemaList() {
    const schemaIds = this._getSchemaIds();

    this.schemaList = schemaIds.reduce((acc, schemaId) => {
      const gSettings = this._initGSettings(schemaId);
      const data = this._getSchemaDataFromDconf(gSettings);

      return Object.assign({}, acc, {
        [schemaId]: {
          gSettings,
          data,
          changeHandlerId: null,
        },
      });
    }, {});
  }

  _initGSettings(schemaId) {

    const GioSSS = Gio.SettingsSchemaSource;

    let schemaDir = this.extension.dir.get_child('schemas');
    let schemaSource;

    if (schemaDir.query_exists(null)) {
      schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
    }
    else {
      schemaSource = GioSSS.get_default();
    }

    let schemaObj = schemaSource.lookup(schemaId, true);

    if (!schemaObj) {
      throw new Error(`Schema ${schemaId} could not be found for this.extension ${this.extension.metadata.uuid}. Please check your installation.`);
    }

    return new Gio.Settings({ settings_schema: schemaObj });
  }

  _getSchemaFile() {
    const schemasDir = this.extension.dir.get_child('schemas');
    if (!schemasDir.query_exists(null)) {
      return null;
    }

    const schemasEnum = schemasDir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);

    if (schemasEnum != null) {
      let info;
      let schemaName;
      while ((info = schemasEnum.next_file(null))) {
        schemaName = info.get_name();
        if (schemaName.endsWith('gschema.xml')) {
          return schemasDir.get_child(schemaName);
        }
      }
    }

    return null;
  }

  _getSchemaIds() {
    const schemaFile = this._getSchemaFile();

    if (!schemaFile) {
      return [];
    }

    let schemaIds = [];

    try {
      const [ok, contents] = schemaFile.load_contents(null);
      if(!ok) {
        return [];
      }

      const schemaJson = xmlParser(ByteArray.toString(contents));
      const schema = schemaJson.schemalist.schema;

      if(Array.isArray(schema)) {
        schemaIds = schema.map(s => s['@path'] ? s['@id'] : undefined ).filter(s => !!s);
      }
      else if(typeof schema == 'object') {
        if(schema['@path']) {
          schemaIds.push(schema['@id']);
        }

      }
    }
    catch (e) {
      debug(`${this.extension.metadata.name} has an error ${e}`);
      return [];
    }

    return schemaIds;
  }

  _getSchemaDataFromDconf(gSettings) {
    const [result, stdout, stderr] = GLib.spawn_command_line_sync(`dconf dump ${gSettings.path}`);

    return ByteArray.toString(stdout).toString();
  }

  _setSchemaDataToDconf({ gSettings, newData }) {
    GLib.spawn_sync(null, ["bash", "-c", `echo "${newData}" | dconf load ${gSettings.path}`], null, GLib.SpawnFlags.SEARCH_PATH, null);
  }

}
