import { SyncData } from '@esync/data';

export enum ApiOperationStatus {
  SUCCESS,
  FAIL,
}

export enum ApiEvent {
  UPLOAD = 'UPLOAD',
  UPLOAD_FINISHED = 'UPLOAD_FINISHED',
  DOWNLOAD = 'DOWNLOAD',
  DOWNLOAD_FINISHED = 'DOWNLOAD_FINISHED',
}

export enum ApiProviderType {
  GITHUB,
  GITLAB,
}

export interface ApiProvider {
  upload(syncData: SyncData): Promise<ApiOperationStatus>;
  download(): Promise<SyncData>;
  getName(): string;
}
