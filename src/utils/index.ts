import { Subprocess, SubprocessFlags, AsyncResult } from '@imports/Gio-2.0';
import { timeout_add, PRIORITY_DEFAULT, Source } from '@imports/GLib-2.0';

export const logger = (prefix: string) => (content: string): void => log(`[extensions-sync] [${prefix}] ${content}`);

export const setTimeout = (func: () => any, millis: number): number => {
  return timeout_add(PRIORITY_DEFAULT, millis, () => {
    func();

    return false;
  });
};

export const clearTimeout = (id: number): boolean => Source.remove(id);

export const execute = async (command: string): Promise<string> => {
  const process = new Subprocess({
    argv: ['bash', '-c', command],
    flags: SubprocessFlags.STDOUT_PIPE,
  });

  process.init(null);

  return new Promise((resolve, reject) => {
    process.communicate_utf8_async(null, null, (_, result: AsyncResult) => {
      const [, stdout, stderr] = process.communicate_utf8_finish(result);
      if (stderr) {
        reject(stderr);
      } else if (stdout) {
        resolve(stdout.trim());
      } else {
        resolve();
      }
    });
  });
};

export const settingsFlagsToEnumList = (flags: number): Array<any> =>
  flags
    .toString(2)
    .split('')
    .reverse()
    .map((state) => parseInt(state, 10))
    .map((state, index) => {
      if (state === 1) {
        return index;
      }
    })
    .filter((value) => value !== undefined);

export const enumListToSettingsFlags = (enumList: Array<any>): number =>
  enumList.reduce((acc, enumValue) => {
    return acc + Math.pow(2, enumValue);
  }, 0);
