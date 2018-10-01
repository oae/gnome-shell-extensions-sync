// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GXml = imports.gi.GXml;

const logger = imports.utils.logger;

const debug = logger('settings');

var Settings = class Settings {

  constructor(extension) {
    this.extension = extension;
    this.schemaList = {};
    this._initSchemaList();
  }

  startWatching() {

    Object.keys(this.schemaList).forEach(schemaId => {
      const schema = this.schemaList[schemaId];
      schema.data = this._getSchemaData(schema.gSettings);
      schema.changeHandlerId = schema.gSettings.connect('changed', () => {
        this._onSettingsChanged(schema);
      });
    });

    debug(`started watching changes for ${this.extension.metadata.name}`);
  }

  stopWatching() {

    Object.keys(this.schemaList).forEach(schemaId => {
      const schema = this.schemaList[schemaId];
      schema.gSettings.disconnect(schema.changeHandlerId);
      schema.changeHandlerId = null;
      schema.data = null;
      debug(`disconnected from ${schemaId}`);
    });

    debug(`stopped watching changes for ${this.extension.metadata.name}`);
  }

  _onSettingsChanged(schema) {
    debug(`extension ${this.extension.metadata.name} is modified emitting sync`);
    schema.data = this._getSchemaData(schema.gSettings);
    sync.emit('extensions-sync');
  }

  _initSchemaList() {
    const schemaIds = this._getSchemaIds();

    this.schemaList = schemaIds.reduce((acc, schemaId) => {
      const gSettings = this._initGSettings(schemaId);
      const data = this._getSchemaData(gSettings);

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

    const schemaIds = [];

    try {
      const doc = GXml.GomDocument.from_file(schemaFile);
      const schemaXml = doc.document_element.get_elements_by_tag_name('schema');
      let element;
      for (let index = 0; index < schemaXml.get_length(); index++) {
        element = schemaXml.get_element(index);
        if(element.has_attribute('path')) {
          schemaIds.push(element.get_attribute('id'));
        }
      }
    }
    catch (e) {
      debug(`${schemaName} has an error ${e}`);
      return [];
    }

    return schemaIds;
  }

  _getSchemaData(gSettings) {
    const [result, stdout, stderr] = GLib.spawn_command_line_sync(`dconf dump ${gSettings.path}`);

    return stdout;
  }

}
