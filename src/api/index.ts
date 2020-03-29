import { Github } from './providers/github';
import { Provider, Result } from './api';

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
