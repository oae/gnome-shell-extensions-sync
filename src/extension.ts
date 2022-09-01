import { Api } from '@esync/api';
import { Data } from '@esync/data';
import { StatusMenu } from '@esync/panel/statusMenu';
import { loadInterfaceXML } from '@esync/shell';
import { Sync } from '@esync/sync';
import { logger } from '@esync/utils';
import { DBus, DBusExportedObject } from '@gi-types/gio2';
import { EventEmitter } from 'events';
import { SyncEvent } from '@esync/api/types';
import './styles/stylesheet.css';

const debug = logger('extension');

class SyncExtension {
  private sync: Sync;
  private statusMenu: StatusMenu;
  private api: Api;
  private eventEmitter: EventEmitter;
  private data: Data;
  private dbus: DBusExportedObject;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.data = new Data();
    this.api = new Api(this.eventEmitter, this.data);
    this.sync = new Sync(this.eventEmitter, this.data);
    this.statusMenu = new StatusMenu(this.eventEmitter);
    const iface = loadInterfaceXML('io.elhan.ExtensionsSync');
    this.dbus = DBusExportedObject.wrapJSObject(iface, this);

    debug('extension is initialized');
  }

  save(): void {
    this.eventEmitter.emit(SyncEvent.SAVE);
  }

  read(): void {
    this.eventEmitter.emit(SyncEvent.READ);
  }

  enable(): void {
    this.sync.start();
    this.statusMenu.show();
    this.dbus.export(DBus.session, '/io/elhan/ExtensionsSync');
    debug('extension is enabled');
  }

  disable(): void {
    this.sync.stop();
    this.statusMenu.hide();
    this.dbus.unexport();
    debug('extension is disabled');
  }
}

export default function (): SyncExtension {
  return new SyncExtension();
}
