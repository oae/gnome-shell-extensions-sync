import * as GLib from '@imports/GLib-2.0';
import { byteArray } from '@imports/Gjs';

export const setTimeout = (func: any, millis: number): number => {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, () => {
    func();

    return false;
  });
};

export const clearTimeout = (id: number): boolean => GLib.Source.remove(id);

export const execute = (command: string): { stdout?: string; stderr?: string } => {
  const [, stdout, stderr] = GLib.spawn_sync(null, ['bash', '-c', command], null, GLib.SpawnFlags.SEARCH_PATH, null);

  return {
    stdout: stdout ? byteArray.toString(stdout) : undefined,
    stderr: stderr ? byteArray.toString(stderr) : undefined,
  };
};

export const logger = (prefix: string) => (content: string): void => log(`[extensions-sync] [${prefix}] ${content}`);
