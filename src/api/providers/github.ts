import { Provider, Result } from '../api';
import { setTimeout } from '../../utils';

export class Github implements Provider {
  upload(): Promise<Result> {
    return new Promise(resolve => setTimeout(resolve, 3000));
  }
  download(): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, 3000));
  }
}
