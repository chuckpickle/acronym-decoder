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

import {vi} from 'vitest';

/**
 * Minimal `chrome.*` stub for jsdom tests. Extend as components need more surface area.
 * Tests can override individual functions with `vi.mocked(chrome.storage.local.get).mockImplementation(...)`.
 */
export function installChromeMock(): void {
    const storageListeners: Array<(changes: object, area: string) => void> = [];
    const chromeMock = {
        runtime: {
            getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
            openOptionsPage: vi.fn(),
            sendMessage: vi.fn(),
            onMessage: {addListener: vi.fn(), removeListener: vi.fn()},
        },
        storage: {
            local: {
                get: vi.fn((_keys: unknown, callback?: (items: Record<string, unknown>) => void) => {
                    callback?.({});
                    return Promise.resolve({});
                }),
                set: vi.fn((_items: unknown, callback?: () => void) => {
                    callback?.();
                    return Promise.resolve();
                }),
            },
            onChanged: {
                addListener: vi.fn((listener: (changes: object, area: string) => void) => {
                    storageListeners.push(listener);
                }),
                removeListener: vi.fn(),
            },
        },
        tabs: {
            create: vi.fn(),
            remove: vi.fn(),
            query: vi.fn(),
            sendMessage: vi.fn(),
        },
    };
    Object.assign(globalThis, {chrome: chromeMock});
}

/** Builds a `fetch` stub that resolves JSON for the given file name / URL suffix. */
export function mockFetchJson(responses: Record<string, unknown>): typeof fetch {
    return vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const match = Object.keys(responses).find(key => url.endsWith(key));
        if (!match) {
            return Promise.resolve(new Response(null, {status: 404, statusText: 'Not Found'}));
        }
        return Promise.resolve(new Response(JSON.stringify(responses[match]), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        }));
    }) as unknown as typeof fetch;
}
