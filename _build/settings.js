// Copyright (c) 2018 O. Alperen Elhan
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const Gio = imports.gi.Gio;
const GXml = imports.gi.GXml;

const { debug } = imports.utils;

class Settings {

  constructor(extension) {
    this.extension = extension;
    this.schemaList = {};

    this._initSchemaList();
  }

  startWatching() {

    Object.keys(this.schemaList).forEach(schemaId => {
      const schema = this.schemaList[schemaId];
      schema.changeHandlerId = schema.gSettings.connect('changed', this._onSettingsChanged.bind(this));
    });

    debug(`[settings] started watching changes for ${this.extension.metadata.name}`);
  }

  stopWatching() {

    Object.keys(this.schemaList).forEach(schemaId => {
      const schema = this.schemaList[schemaId];
      schema.gSettings.disconnect(schema.changeHandlerId);
      schema.changeHandlerId = null;
      debug(`[settings] disconnected from ${schemaId}`);
    });

    debug(`[settings] stopped watching changes for ${this.extension.metadata.name}`);
  }

  _onSettingsChanged() {
    debug(`[settings] extension ${this.extension.metadata.name} is modified emitting sync`);
    sync.emit('extensions-sync');
  }

  _initSchemaList() {
    const schemaIds = this._getSchemaIds();

    this.schemaList = schemaIds.reduce((acc, schemaId) => {
      return Object.assign({}, acc, {
        [schemaId]: {
          gSettings: this._initGSettings(schemaId),
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
      debug(`[settings] ${schemaName} has an error ${e}`);
      return [];
    }

    return schemaIds;
  }

}
