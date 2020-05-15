import { DataProvider } from '../';
import { logger } from '../../utils';

const debug = logger('tweaks-data-provider');

export type TweaksData = {
  [key: string]: string;
};

export class TweaksDataProvider implements DataProvider {
  async getData(): Promise<TweaksData> {
    return {};
  }
  async useData(tweaksData: TweaksData): Promise<void> {
    debug(`${tweaksData}`);
  }
  getName(): string {
    return 'tweaks';
  }
}
