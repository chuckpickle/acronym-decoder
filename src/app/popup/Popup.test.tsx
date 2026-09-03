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

import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Popup} from './Popup';
import {ConfigurationService} from '../core/configuration/configuration.service';
import {LookupModel} from '../models/lookup.model';
import {LookupSource} from '../models/lookup-source.enum';
import {createTestServices, renderWithServices, testConfig} from '../../testing/render-with-services';

describe('Popup', () => {
    const results: LookupModel[] = [
        {acronym: 'API', definition: 'Application Programming Interface', links: [{name: 'wiki', link: 'https://example.com/api'}], related: []},
        {acronym: 'API', definition: 'Another definition', links: [], related: []},
    ];

    function setup(lookup: () => Promise<LookupModel[]> = () => Promise.resolve(results), online = true) {
        const services = createTestServices({version: '2.3.4'});
        ConfigurationService.isBackendOnline = online;
        const lookupSpy = vi.spyOn(services.definitionService, 'lookupTerm').mockImplementation(lookup);
        const utils = renderWithServices(<Popup/>, services);
        return {...utils, lookupSpy};
    }

    it('renders config and version', async () => {
        setup();
        expect(await screen.findByText('v2.3.4')).toBeInTheDocument();
        expect(screen.getByText(testConfig.contactEmail)).toHaveAttribute('id', 'email');
        expect(screen.getByText('Acronyms & Terms - Decoded')).toBeInTheDocument();
    });

    it('shows the online icon when the backend is online', async () => {
        const {container} = setup();
        await waitFor(() => expect(container.querySelector('#icon')).toHaveAttribute('src', testConfig.onlineIconPath));
    });

    it('shows the offline icon when the backend is offline', async () => {
        const {container} = setup(undefined, false);
        await waitFor(() => expect(container.querySelector('#icon')).toHaveAttribute('src', testConfig.offlineIconPath));
    });

    it('disables the search button while the term is empty', async () => {
        setup();
        const button = screen.getByRole('button', {name: 'search'});
        expect(button).toBeDisabled();
        await userEvent.type(screen.getByPlaceholderText('Search for an acronym or a term'), 'api');
        expect(button).toBeEnabled();
    });

    it('submits, shows the loading state, then renders results', async () => {
        let resolve!: (value: LookupModel[]) => void;
        const {lookupSpy, container} = setup(() => new Promise<LookupModel[]>(r => (resolve = r)));

        await userEvent.type(screen.getByPlaceholderText('Search for an acronym or a term'), 'api');
        await userEvent.click(screen.getByRole('button', {name: 'search'}));

        expect(lookupSpy).toHaveBeenCalledWith('api', LookupSource.popup);
        expect(screen.getByText('Looking up definitions for API...')).toBeInTheDocument();
        expect(container.querySelector('.spinner-border')).toBeInTheDocument();
        expect(container.querySelector('#resultsBody')).not.toBeInTheDocument();

        resolve(results);

        expect(await screen.findByText('API:')).toHaveAttribute('id', 'resultsHeader');
        expect(container.querySelector('.spinner-container')).not.toBeInTheDocument();
        expect(container.querySelectorAll('#resultsTable li')).toHaveLength(2);
        expect(screen.getByText('Application Programming Interface')).toBeInTheDocument();
        const link = screen.getByText('https://example.com/api');
        expect(link).toHaveClass('def-link');
        expect(link).toHaveAttribute('href', 'https://example.com/api');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('shows the no-results message for an empty result set', async () => {
        setup(() => Promise.resolve([]));
        await userEvent.type(screen.getByPlaceholderText('Search for an acronym or a term'), 'zzz');
        await userEvent.click(screen.getByRole('button', {name: 'search'}));
        expect(await screen.findByText('No matches found for "ZZZ"!')).toHaveAttribute('id', 'noResults');
    });

    it('shows the no-results message when the lookup fails', async () => {
        setup(() => Promise.reject(new Error('offline')));
        await userEvent.type(screen.getByPlaceholderText('Search for an acronym or a term'), 'api');
        await userEvent.click(screen.getByRole('button', {name: 'search'}));
        expect(await screen.findByText('No matches found for "API"!')).toBeInTheDocument();
    });

    it('opens the options page from the settings gear', async () => {
        const {container} = setup();
        await userEvent.click(container.querySelector('#settingsIcon')!);
        expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    });

    it('opens the default mail client from the email link', async () => {
        setup();
        await userEvent.click(await screen.findByText(testConfig.contactEmail));
        expect(chrome.tabs.create).toHaveBeenCalledWith({url: 'mailto:' + testConfig.contactEmail}, expect.any(Function));
    });
});
