import { DataProvider } from '../../../data';
import { getAllExtensionConfigData, getExtensionIds, removeExtension, installExtension } from './utils';
import { writeDconfData } from '../../../shell';

export type ExtensionData = {
  [key: string]: {
    [key: string]: string;
  };
};

export class ExtensionsDataProvider implements DataProvider {
  async getData(): Promise<ExtensionData> {
    return getAllExtensionConfigData();
  }

  async useData(extensionData: ExtensionData): Promise<void> {
    const downloadedExtensions = Object.keys(extensionData);
    const localExtensions = getExtensionIds();
    localExtensions.forEach(
      (extensionId) => downloadedExtensions.indexOf(extensionId) < 0 && removeExtension(extensionId),
    );

    await Promise.all(
      downloadedExtensions.map((extensionId) => {
        return Object.keys(extensionData[extensionId]).map((schemaPath) => {
          return writeDconfData(schemaPath, extensionData[extensionId][schemaPath]);
        });
      }),
    );

    await Promise.all(
      downloadedExtensions.map(
        async (extensionId) => localExtensions.indexOf(extensionId) < 0 && installExtension(extensionId),
      ),
    );
  }

  getName(): string {
    return 'extensions';
  }
}
