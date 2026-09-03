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

import {ConfigurationService} from '../configuration/configuration.service';
import {DefinitionService} from './definition.service';
import {LookupSource} from '../../models/lookup-source.enum';
import {LookupModel} from '../../models/lookup.model';
import {mockFetchJson} from '../../../testing/chrome-mock';
import {testConfig} from '../../../testing/render-with-services';

const glossary: LookupModel[] = [
    {acronym: 'API', definition: 'Application Programming Interface', links: [], related: []},
    {acronym: 'api', definition: 'Another one', links: [], related: []},
    {acronym: 'CSS', definition: 'Cascading Style Sheets', links: [], related: []},
];

function build(config = testConfig) {
    const fetchFn = mockFetchJson({
        'manifest.json': {version: '1.0.0'},
        'config.json': config,
        'glossary.json': glossary,
        'q=API&dep=false': {slurp: [glossary[0]]},
    });
    const configurationService = new ConfigurationService(fetchFn);
    return {fetchFn, service: new DefinitionService(configurationService, fetchFn)};
}

describe('DefinitionService', () => {
    it('populates configuration on construction', async () => {
        const {service} = build();
        await service.populateConfiguration();
        expect(service.config).toEqual(testConfig);
    });

    it('looks up locally (case-insensitive) when remote lookup is disabled', async () => {
        const {service} = build();
        const results = await service.lookupTerm('api', LookupSource.popup);
        expect(results).toEqual([glossary[0], glossary[1]]);
        expect(service.previousSearchTerm).toBe('api');
    });

    it('returns an empty list when nothing matches locally', async () => {
        const {service} = build();
        await expect(service.lookupTerm('nope', LookupSource.lookup)).resolves.toEqual([]);
    });

    it('looks up remotely when remote lookup is enabled', async () => {
        const {service, fetchFn} = build({...testConfig, enableRemoteLookup: true});
        const results = await service.lookupTerm('API', LookupSource.popup);
        expect(results).toEqual([glossary[0]]);
        expect(fetchFn).toHaveBeenCalledWith(testConfig.lookupApiUrl + 'API&dep=false');
    });

    it('rejects when the remote lookup fails', async () => {
        const {service} = build({...testConfig, enableRemoteLookup: true});
        await expect(service.lookupTerm('CSS', LookupSource.popup)).rejects.toThrow('Not Found');
    });
});
