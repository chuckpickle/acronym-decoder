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

import {act, fireEvent, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi, type Mock} from 'vitest';
import {ConfigModel} from '../models/config.model';
import {ModifierEnum} from '../models/modifier.enum';
import {createTestServices, renderWithServices, testConfig} from '../../testing/render-with-services';
import {Homepage} from './Homepage';
import {sanitizeUrl} from './sanitize-url';

/** Renders the options page and flushes the mount promises (config / version). */
async function renderHomepage(config: ConfigModel = testConfig) {
    const result = renderWithServices(<Homepage />, createTestServices({config, version: '1.2.3'}));
    await act(async () => {
    });
    return result;
}

function mockStoredOptions(stored: Record<string, unknown>): void {
    (chrome.storage.local.get as unknown as Mock).mockImplementation(
        (_keys: unknown, callback?: (items: Record<string, unknown>) => void) => {
            callback?.(stored);
            return Promise.resolve(stored);
        });
}

describe('Homepage', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('loads the configuration, version and stored options', async () => {
        mockStoredOptions({lookupEnabled: false, lookupModifier: ModifierEnum.alt_dbl_click, notFoundDialog: false});
        await renderHomepage();

        expect(chrome.storage.local.get).toHaveBeenCalledWith(
            ['lookupEnabled', 'lookupModifier', 'notFoundDialog'], expect.any(Function));
        expect(screen.getByText('v1.2.3')).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', testConfig.mainIconPath);
        expect(screen.getByRole('link', {name: testConfig.contactEmail}))
            .toHaveAttribute('href', `mailto:${testConfig.contactEmail}`);
        expect(screen.getByRole('link', {name: testConfig.extensionInfoPageName}))
            .toHaveAttribute('href', testConfig.extensionInfoPageLink);
        expect(screen.getByRole('link', {name: testConfig.slackChannelName}))
            .toHaveAttribute('href', testConfig.slackChannelLink);

        expect(screen.getByLabelText('On page lookup')).toHaveValue('false');
        expect(screen.getByLabelText('Mouse click modifier')).toHaveValue(String(ModifierEnum.alt_dbl_click));
        expect(screen.getByLabelText('"Definition Not Found" dialog')).toHaveValue('false');
    });

    it('defaults the options when nothing is stored', async () => {
        await renderHomepage();

        expect(screen.getByLabelText('On page lookup')).toHaveValue('true');
        expect(screen.getByLabelText('Mouse click modifier')).toHaveValue(String(ModifierEnum.meta_dbl_click));
        expect(screen.getByLabelText('"Definition Not Found" dialog')).toHaveValue('true');
    });

    it('saves the changed options as booleans and numbers', async () => {
        await renderHomepage();

        fireEvent.change(screen.getByLabelText('On page lookup'), {target: {value: 'false'}});
        fireEvent.change(screen.getByLabelText('Mouse click modifier'),
            {target: {value: String(ModifierEnum.ctrl_alt_dbl_click)}});
        fireEvent.change(screen.getByLabelText('"Definition Not Found" dialog'), {target: {value: 'false'}});

        fireEvent.click(screen.getByRole('button', {name: /Saving|Save/}));

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            lookupEnabled: false,
            lookupModifier: ModifierEnum.ctrl_alt_dbl_click,
            notFoundDialog: false,
        }, expect.any(Function));
    });

    it('shows the fake spinner for 2 seconds and then the saved state', async () => {
        await renderHomepage();
        const button = screen.getByRole('button');

        fireEvent.click(button);
        expect(button).toHaveTextContent('Saving');
        expect(button.querySelector('.spinner-border')).not.toBeNull();
        expect(button).toHaveClass('btn-ad-primary');

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(button).toHaveTextContent('Saved');
        expect(button.querySelector('.material-icons')).toHaveTextContent('check');
        expect(button).toHaveClass('btn-ad-primary');
    });

    it('resets the saved state when an option changes', async () => {
        await renderHomepage();
        const button = screen.getByRole('button');

        fireEvent.click(button);
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(button).toHaveTextContent('Saved');

        fireEvent.change(screen.getByLabelText('On page lookup'), {target: {value: 'false'}});

        expect(button).toHaveTextContent('Save');
        expect(button).not.toHaveTextContent('Saved');
        expect(button).toHaveClass('btn-ad-accent');
    });

    it('does not update the state after unmount', async () => {
        const {unmount} = await renderHomepage();

        fireEvent.click(screen.getByRole('button'));
        unmount();

        expect(() => act(() => {
            vi.advanceTimersByTime(2000);
        })).not.toThrow();
    });

    it('drops a slack channel link with an unsafe scheme', async () => {
        const unsafeConfig = {...testConfig, slackChannelLink: 'javascript:alert(1)'};
        await renderHomepage(unsafeConfig);

        expect(screen.getByText(testConfig.slackChannelName)).not.toHaveAttribute('href');
        expect(screen.queryByRole('link', {name: testConfig.slackChannelName})).toBeNull();
    });

    describe('sanitizeUrl', () => {
        it('keeps allow-listed schemes', () => {
            expect(sanitizeUrl('slack://channel?team=T&id=C')).toBe('slack://channel?team=T&id=C');
            expect(sanitizeUrl('https://example.com/info')).toBe('https://example.com/info');
            expect(sanitizeUrl('http://example.com/info')).toBe('http://example.com/info');
            expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
            expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
        });

        it('drops everything else', () => {
            expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
            expect(sanitizeUrl('  JavaScript:alert(1)')).toBeUndefined();
            expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeUndefined();
            expect(sanitizeUrl(undefined)).toBeUndefined();
            expect(sanitizeUrl('')).toBeUndefined();
        });
    });
});
