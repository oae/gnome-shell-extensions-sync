import { SyncData } from '@esync/data';
import { File, FileCreateFlags } from '@imports/Gio-2.0';
import { SyncOperationStatus, SyncProvider } from '../types';

export class Local implements SyncProvider {
  private backupfileLocation: string;

  constructor(backupfileLocation: string) {
    this.backupfileLocation = backupfileLocation;
  }

  async save(syncData: SyncData): Promise<SyncOperationStatus> {
    if (!this.backupfileLocation) {
      throw new Error('Please select a backup file location from preferences');
    }
    const backupFile = File.new_for_uri(this.backupfileLocation);
    if (!backupFile.query_exists(null)) {
      throw new Error(`Failed to backup settings. ${this.backupfileLocation} does not exist`);
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
    const backupFile = File.new_for_uri(this.backupfileLocation);
    if (!backupFile.query_exists(null)) {
      throw new Error(`Failed to read settings from backup. ${this.backupfileLocation} does not exist`);
    }

    const [status, syncDataBytes] = backupFile.load_contents(null);

    if (!syncDataBytes.length || !status) {
      throw new Error(`Failed to read settings from backup. ${this.backupfileLocation} is corrupted`);
    }

    try {
      return JSON.parse(imports.byteArray.toString(syncDataBytes));
    } catch (err) {
      throw new Error(`${this.backupfileLocation} is not a json file`);
    }
  }

  getName(): string {
    return 'Local';
  }
}
