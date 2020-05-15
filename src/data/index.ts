import { Settings } from '@imports/Gio-2.0';

import { logger, settingsFlagsToEnumList } from '../utils';
import { getCurrentExtensionSettings } from '../shell';
import { ExtensionsDataProvider, ExtensionData } from './providers/extensions/provider';
import { KeyBindingsDataProvider, KeyBindingsData } from './providers/keybindings';
import { TweaksDataProvider, TweaksData } from './providers/tweaks';

const debug = logger('data');

export type SyncData = {
  extensions: ExtensionData;
  keybindings: KeyBindingsData;
  tweaks: TweaksData;
};

export enum DataOperationStatus {
  SUCCESS,
  FAIL,
}

export enum DataProviderType {
  EXTENSIONS,
  KEYBINDINGS,
  TWEAKS,
}

export interface DataProvider {
  getData(): Promise<ExtensionData | KeyBindingsData | TweaksData>;
  useData(data: ExtensionData | KeyBindingsData | TweaksData): Promise<void>;
  getName(): string;
}

export class Data {
  private settings: Settings;
  private providers: Array<DataProvider>;

  constructor() {
    this.settings = getCurrentExtensionSettings();
    this.providers = this.createProviders();
    this.settings.connect('changed', this.updateProviders.bind(this));
  }

  async getSyncData(): Promise<SyncData> {
    const resultList = await Promise.all(
      this.providers.map(async (provider) => {
        return {
          [provider.getName()]: await provider.getData(),
        };
      }),
    );

    return resultList.reduce(
      (acc: SyncData, result) => {
        return {
          ...acc,
          ...result,
        };
      },
      { extensions: {}, keybindings: {}, tweaks: {} },
    );
  }

  async use(syncData: SyncData): Promise<void> {
    await Promise.all(
      this.providers.map(async (provider) => {
        debug(`updating ${provider.getName()} settings in local machine`);
        await provider.useData(syncData[provider.getName()]);
      }),
    );
  }

  private createProvider(providerType: DataProviderType): DataProvider {
    switch (providerType) {
      case DataProviderType.EXTENSIONS: {
        return new ExtensionsDataProvider();
      }
      case DataProviderType.KEYBINDINGS: {
        return new KeyBindingsDataProvider();
      }
      case DataProviderType.TWEAKS: {
        return new TweaksDataProvider();
      }
    }
  }

  private createProviders(): Array<DataProvider> {
    const providerFlag = this.settings.get_flags('data-providers');
    const providerTypes: Array<DataProviderType> = settingsFlagsToEnumList(providerFlag);
    debug(`enabled data providers are ${providerTypes.map((p) => DataProviderType[p])}`);

    return providerTypes
      .map((providerType) => this.createProvider(providerType))
      .filter((provider) => provider !== undefined);
  }

  private updateProviders(): void {
    this.providers = this.createProviders();
  }
}
