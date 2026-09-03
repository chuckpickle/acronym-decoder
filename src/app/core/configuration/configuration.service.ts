/*
SPDX-Copyright: Copyright (c) Capital One Services,LLC 
SPDX-License-Identifier: Apache-2.0

Copyright 2018 Capital One Services, LLC
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
 */

import {ConfigModel} from '../../models/config.model';

export interface ExtensionManifest {
    version: string;
    [key: string]: unknown;
}

export class ConfigurationService {

    static isBackendOnline = true;

    // file names for chrome assets
    manifestFileName = 'manifest.json';
    configFileName = 'config.json';

    manifest?: ExtensionManifest;
    config?: ConfigModel;

    private manifestRequest?: Promise<ExtensionManifest>;
    private configRequest?: Promise<ConfigModel>;

    constructor(private readonly fetchFn: typeof fetch = (...args) => fetch(...args)) {
        ConfigurationService.isBackendOnline = true;
    }

    async getJsonFileContent<T = unknown>(fileName: string): Promise<T> {
        const response = await this.fetchFn(chrome.runtime.getURL(fileName));
        if (!response.ok) {
            throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
        }
        return response.json() as Promise<T>;
    }

    getExtensionVersion(): Promise<string> {
        if (this.manifest) {
            return Promise.resolve(this.manifest.version);
        }
        this.manifestRequest ??= this.getJsonFileContent<ExtensionManifest>(this.manifestFileName)
            .then(manifest => {
                this.manifest = manifest;
                return manifest;
            });
        return this.manifestRequest.then(manifest => manifest.version);
    }

    getConfiguration(): Promise<ConfigModel> {
        if (this.config) {
            return Promise.resolve(this.config);
        }
        this.configRequest ??= this.getJsonFileContent<ConfigModel>(this.configFileName)
            .then(config => {
                this.config = config;
                return config;
            });
        return this.configRequest;
    }

}
