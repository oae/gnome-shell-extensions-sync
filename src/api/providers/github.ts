import { Provider, Result } from '../';
import { setTimeout } from '../../utils';

export class Github implements Provider {
  async upload(): Promise<Result> {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  }
  async download(): Promise<Result> {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  }
  getName(): string {
    return 'Github';
  }
}
