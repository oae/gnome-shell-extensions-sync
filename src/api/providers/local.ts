import { SyncData } from '@esync/data';
import { File, FileCreateFlags } from '@imports/gio2';
import { SyncOperationStatus, SyncProvider } from '../types';

export class Local implements SyncProvider {
  private backupFileLocation: string;

  constructor(backupFileLocation: string) {
    this.backupFileLocation = backupFileLocation;
  }

  async save(syncData: SyncData): Promise<SyncOperationStatus> {
    if (!this.backupFileLocation) {
      throw new Error('Please select a backup file location from preferences');
    }
    const backupFile = File.new_for_uri(this.backupFileLocation);
    if (!backupFile.query_exists(null)) {
      throw new Error(`Failed to backup settings. ${this.backupFileLocation} does not exist`);
    }

    backupFile.replace_contents(
      imports.byteArray.fromString(JSON.stringify(syncData)),
      null,
      false,
      FileCreateFlags.REPLACE_DESTINATION,
      null,
    );

    return SyncOperationStatus.SUCCESS;
  }

  async read(): Promise<SyncData> {
    const backupFile = File.new_for_uri(this.backupFileLocation);
    if (!backupFile.query_exists(null)) {
      throw new Error(`Failed to read settings from backup. ${this.backupFileLocation} does not exist`);
    }

    const [status, syncDataBytes] = backupFile.load_contents(null);

    if (!syncDataBytes.length || !status) {
      throw new Error(`Failed to read settings from backup. ${this.backupFileLocation} is corrupted`);
    }

    try {
      return JSON.parse(imports.byteArray.toString(syncDataBytes));
    } catch (err) {
      throw new Error(`${this.backupFileLocation} is not a json file`);
    }
  }

  getName(): string {
    return 'Local';
  }
}
