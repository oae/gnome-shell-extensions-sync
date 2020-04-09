import { byteArray } from '@imports/Gjs';
import { DataInputStream, UnixInputStream } from '@imports/Gio-2.0';
import { timeout_add, PRIORITY_DEFAULT, Source, spawn_async_with_pipes, SpawnFlags } from '@imports/GLib-2.0';

export const setTimeout = (func: any, millis: number): number => {
  return timeout_add(PRIORITY_DEFAULT, millis, () => {
    func();

    return false;
  });
};

export const clearTimeout = (id: number): boolean => Source.remove(id);

export const execute = async (command: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const [success, pid, , stdout] = spawn_async_with_pipes(
        null,
        ['bash', '-c', command],
        null,
        SpawnFlags.SEARCH_PATH,
        null,
      );
      if (!pid) {
        resolve();
        return;
      }
      if (success && pid != 0 && stdout) {
        const stdoutStream = new UnixInputStream({ fd: stdout, close_fd: true });
        const dataStdoutStream = new DataInputStream({ base_stream: stdoutStream });
        const readStdOut = (): any => {
          dataStdoutStream.fill_async(-1, PRIORITY_DEFAULT, null, (stream, result) => {
            const cnt = dataStdoutStream.fill_finish(result);

            if (cnt == 0) {
              stdoutStream.close(null);
              resolve(byteArray.toString(dataStdoutStream.peek_buffer()).trim());
              return;
            }
            // Try to read more
            dataStdoutStream.set_buffer_size(2 * dataStdoutStream.get_buffer_size());
            readStdOut();
          });
        };
        readStdOut();
      }
    } catch (ex) {
      resolve();
    }
  });
};

export const logger = (prefix: string) => (content: string): void => log(`[extensions-sync] [${prefix}] ${content}`);
