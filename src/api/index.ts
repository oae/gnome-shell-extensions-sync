import { Github } from './providers/github';

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
  getName(): string;
}

export class Api {
  private provider: Provider;

  constructor() {
    // We use github as a provider for now.
    this.provider = new Github();
  }

  upload(): Promise<Result> {
    return this.provider.upload();
  }

  download(): Promise<void> {
    return this.provider.download();
  }

  getName(): string {
    return this.provider.getName();
  }
}
