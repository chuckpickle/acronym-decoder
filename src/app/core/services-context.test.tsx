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

import {render, screen} from '@testing-library/react';
import {ServicesProvider, useConfigurationService, useDefinitionService, useServices} from './services-context';
import {createTestServices} from '../../testing/render-with-services';

function Probe() {
    const {configurationService} = useServices();
    const sameConfig = useConfigurationService() === configurationService;
    const definitionService = useDefinitionService();
    return <span>{String(sameConfig)}:{definitionService.glossaryFileName}</span>;
}

describe('ServicesProvider', () => {
    it('exposes the injected services through the hooks', () => {
        render(<ServicesProvider services={createTestServices()}><Probe /></ServicesProvider>);
        expect(screen.getByText('true:glossary.json')).toBeInTheDocument();
    });

    it('creates default services when none are supplied', () => {
        render(<ServicesProvider><Probe /></ServicesProvider>);
        expect(screen.getByText('true:glossary.json')).toBeInTheDocument();
    });

    it('throws when used outside the provider', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => render(<Probe />)).toThrow(/within a <ServicesProvider>/);
    });
});
