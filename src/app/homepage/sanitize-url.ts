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

/**
 * Schemes an `href` may use. The Slack deep link (`slack:`) is the reason the Angular
 * template needed `DomSanitizer.bypassSecurityTrustUrl`; everything else that is not on
 * this list (notably `javascript:` and `data:`) is dropped.
 */
const ALLOWED_SCHEMES = ['slack:', 'https:', 'http:', 'mailto:'];

/**
 * Returns the url when its scheme is allow-listed, otherwise `undefined` so the caller
 * renders no `href` at all. Scheme-relative and relative urls resolve against the page,
 * so they are allowed too.
 */
export function sanitizeUrl(url?: string | null): string | undefined {
    if (!url) {
        return undefined;
    }
    const trimmed = url.trim();
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed);
    if (scheme && !ALLOWED_SCHEMES.includes(scheme[1].toLowerCase() + ':')) {
        return undefined;
    }
    return trimmed;
}
