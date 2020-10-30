import { SyncData } from '@esync/data';

export enum SyncOperationStatus {
  SUCCESS,
  FAIL,
}

export enum SyncEvent {
  SAVE = 'SAVE',
  SAVE_FINISHED = 'SAVE_FINISHED',
  READ = 'READ',
  READ_FINISHED = 'READ_FINISHED',
}

export enum SyncProviderType {
  GITHUB,
  GITLAB,
  LOCAL,
}

export interface SyncProvider {
  save(syncData: SyncData): Promise<SyncOperationStatus>;
  read(): Promise<SyncData>;
  getName(): string;
}
