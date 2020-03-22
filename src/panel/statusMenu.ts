import { Api } from "src/api";

const Me = imports.misc.extensionUtils.getCurrentExtension();

const { IconTheme } = imports.gi.Gtk;
const { BoxLayout, Icon } = imports.gi.St;
const Gio = imports.gi.Gio;
const { Button } = imports.ui.panelMenu;
const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const Main = imports.ui.main;

export class StatusMenu {
  private api: Api;
  private button: any;

  constructor(api: Api) {
    this.api = api;
    const extension = imports.misc.extensionUtils.getCurrentExtension();
  }

  show(): void {
    if (this.button === undefined) {
      this.createButton();
    }

    Main.panel.addToStatusArea("extensions-sync", this.button);
  }

  hide(): void {
    this.button.destroy();
    this.button = undefined;
  }

  private createButton(): void {
    this.button = new Button(0, _("Sync Settings"));
    this.button.icon = this.createUploadIcon();
    this.button.add_actor(this.button.icon);
  }

  private createUploadIcon(): any {
    return this.createIcon(
      `${Me.path}/icons/extensions-sync-synced-symbolic.svg`
    );
  }

  private createIcon(iconPath: string): any {
    return new Icon({
      gicon: Gio.icon_new_for_string(iconPath),
      style_class: "system-status-icon"
    });
  }
}
