import * as GLib from '@imports/GLib-2.0';

export const setTimeout = (func: any, millis: number): number => {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, () => {
    func();

    return false;
  });
};

export const clearTimeout = (id: number): boolean => GLib.Source.remove(id);
