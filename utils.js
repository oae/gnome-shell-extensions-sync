// Copyright (c) 2018 O. Alperen Elhan
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const GXml = imports.gi.GXml;
const Gio = imports.gi.Gio;

function debug(content) {
    log(`[extensions-sync] ${content}`);
}

function getSchemaFile(extension) {
    const schemasDir = extension.dir.get_child('schemas');
    if(!schemasDir.query_exists(null)) {
        return null;
    }

    const schemasEnum = schemasDir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NONE, null);

    if (schemasEnum != null) {
        let info;
        let schemaName;
        while ((info = schemasEnum.next_file(null))) {
            schemaName = info.get_name();
            if(schemaName.endsWith('.xml')) {
                return schemasDir.get_child(schemaName);
            }
        }
    }

    return null;
}

function getSettingsPath(extension) {
    
    const schemaFile = getSchemaFile(extension);

    if(!schemaFile) {
        return null;
    }
    
    try {
        const doc = GXml.GomDocument.from_file (schemaFile);
        const schemaXml = doc.document_element.get_elements_by_tag_name('schema')
        for (let index = 0; index < schemaXml.get_length(); index++) {
            const element = schemaXml.get_element(index);
            if(element.has_attribute('path')) {
                return element.get_attribute('path');
            }
        }
    }
    catch(e) {
        debug(`${schemaName} has an error ${e}`);
    }
}