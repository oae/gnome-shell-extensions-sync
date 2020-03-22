export enum Status {
  SUCCESS,
  FAIL,
}

export interface Result {
  status: Status;
  response: any;
}

export interface Provider {
  upload(): Result;
  download(): any;
}
