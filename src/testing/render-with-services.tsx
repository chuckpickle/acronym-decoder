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

import {render, type RenderOptions} from '@testing-library/react';
import type {ReactElement} from 'react';
import {MemoryRouter} from 'react-router-dom';
import {ConfigurationService} from '../app/core/configuration/configuration.service';
import {DefinitionService} from '../app/core/definition/definition.service';
import {ServicesProvider, type Services} from '../app/core/services-context';
import {ConfigModel} from '../app/models/config.model';
import {mockFetchJson} from './chrome-mock';

export const testConfig: ConfigModel = {
    mainIconPath: 'assets/main-icon.png',
    onlineIconPath: 'assets/main-icon.png',
    offlineIconPath: 'assets/browser-icon-local.png',
    contactEmail: 'test@example.com',
    lookupApiUrl: 'https://lookup.example.com/?q=',
    enableRemoteLookup: false,
    slackChannelLink: 'slack://channel?team=T&id=C',
    slackChannelName: '#test-channel',
    extensionInfoPageLink: 'https://example.com/info',
    extensionInfoPageName: 'Info Page',
    googleAnalyticsEnabled: false,
    googleAnalyticsId: '',
};

export interface TestServicesOptions {
    config?: ConfigModel;
    version?: string;
    glossary?: unknown[];
}

/** Real services backed by a fetch stub (replaces `createConfigServiceSpy` from the Karma helpers). */
export function createTestServices({config = testConfig, version = '1.0.0', glossary = []}: TestServicesOptions = {}): Services {
    const fetchFn = mockFetchJson({
        'manifest.json': {version},
        'config.json': config,
        'glossary.json': glossary,
    });
    const configurationService = new ConfigurationService(fetchFn);
    const definitionService = new DefinitionService(configurationService, fetchFn);
    return {configurationService, definitionService};
}

export function renderWithServices(ui: ReactElement, services: Services = createTestServices(), options?: RenderOptions) {
    return {
        services,
        ...render(
            <ServicesProvider services={services}>
                <MemoryRouter>{ui}</MemoryRouter>
            </ServicesProvider>,
            options
        ),
    };
}
