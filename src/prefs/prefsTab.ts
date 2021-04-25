import { getCurrentExtension, getCurrentExtensionSettings, ShellExtension } from '@esync/shell';
import { Settings } from '@imports/gio2';
import { registerClass } from '@imports/gobject2';
import { Box, Label, Notebook } from '@imports/gtk4';

export const PrefsTab = registerClass(
  {},
  class PrefsTab extends Box {
    private title: string;
    protected extension: ShellExtension;
    protected settings: Settings;

    _init(params) {
      const { title, ...args } = params;
      this.title = title;
      this.extension = getCurrentExtension();
      this.settings = getCurrentExtensionSettings();
      super._init(args);
    }
    attach(tab: Notebook): void {
      tab.append_page(
        this,
        new Label({
          label: this.title,
        }),
      );
      tab.get_page(this).tabExpand = true;
    }
  },
);
