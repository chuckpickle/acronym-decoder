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

import {ConfigurationService} from './configuration.service';
import {mockFetchJson} from '../../../testing/chrome-mock';
import {testConfig} from '../../../testing/render-with-services';

describe('ConfigurationService', () => {
    let fetchFn: typeof fetch;
    let service: ConfigurationService;

    beforeEach(() => {
        fetchFn = mockFetchJson({'manifest.json': {version: '2.0.0'}, 'config.json': testConfig});
        service = new ConfigurationService(fetchFn);
    });

    it('marks the backend online on construction', () => {
        expect(ConfigurationService.isBackendOnline).toBe(true);
    });

    it('loads JSON via chrome.runtime.getURL', async () => {
        await expect(service.getJsonFileContent('config.json')).resolves.toEqual(testConfig);
        expect(chrome.runtime.getURL).toHaveBeenCalledWith('config.json');
        expect(fetchFn).toHaveBeenCalledWith('chrome-extension://test-id/config.json');
    });

    it('returns and caches the extension version', async () => {
        await expect(service.getExtensionVersion()).resolves.toBe('2.0.0');
        await expect(service.getExtensionVersion()).resolves.toBe('2.0.0');
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('returns and caches the configuration', async () => {
        await expect(service.getConfiguration()).resolves.toEqual(testConfig);
        await expect(service.getConfiguration()).resolves.toEqual(testConfig);
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('rejects when the file cannot be loaded', async () => {
        await expect(service.getJsonFileContent('missing.json')).rejects.toThrow('Not Found');
    });
});
