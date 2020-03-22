export enum Status {
  SUCCESS,
  FAIL,
}

export class Result {
  status?: Status;
  response: any;
}

export interface Provider {
  upload(): Promise<Result>;
  download(): Promise<any>;
}
