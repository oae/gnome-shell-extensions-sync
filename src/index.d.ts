declare const imports: {
  ui: {
    main: {
      notify: (arg: string) => void;
      panel: any;
      extensionManager: {
        getUuids: () => Array<string>;
        lookup: (extensionId: string) => any;
        createExtensionObject: (extensionId: string, dir: any, extensionType: number) => any;
      };
    };
    panelMenu: any;
    popupMenu: any;
    extensionDownloader: {
      uninstallExtension: (extensionId: string) => void;
    };
  };
  misc: {
    extensionUtils: {
      getCurrentExtension: () => any;
      getSettings: () => any;
      ExtensionState: any;
      ExtensionType: any;
    };
    config: any;
  };
  byteArray: {
    fromString: (input: string) => Uint8Array;
    fromArray: (input: number[]) => any;
    fromGBytes: (input: any) => Uint8Array;
    toString: (x: Uint8Array) => string;
  };
};
declare const log: (arg: any) => void;
declare const _: (arg: string) => string;
