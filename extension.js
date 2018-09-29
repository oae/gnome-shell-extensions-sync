
const ExtensionSystem = imports.ui.extensionSystem;
const St = imports.gi.St;
const Main = imports.ui.main;
const { Button } = imports.ui.panelMenu;
const Gio = imports.gi.Gio;

const Config = imports.misc.config;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const { debug, getSettingsPath } = Me.imports.utils;

let text, button;

let extensionChangeHandler;

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
    Object.keys(ExtensionUtils.extensions).forEach(uuid => {
        const extension = ExtensionUtils.extensions[uuid];
        const hasPrefs = extension.hasPrefs;
        if(hasPrefs) {
            const settingsPath = getSettingsPath(extension);
            debug(`dconf dump ${settingsPath} > backup.conf`);
        }
    });
}


function onStateChange(event, extension) {
    debug(`state of ${extension.metadata.name} changed to: ${extension.state}`);
}

function enable() {
    extensionChangeHandler = ExtensionSystem.connect('extension-state-changed', onStateChange);
    
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    ExtensionSystem.disconnect(extensionChangeHandler);
    Main.panel._rightBox.remove_child(button);
}
