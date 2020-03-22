import { Provider, Result } from '../api';

export class Github implements Provider {
  upload(): Result {
    throw new Error('Method not implemented.');
  }
  download(): any {
    throw new Error('Method not implemented.');
  }
}
