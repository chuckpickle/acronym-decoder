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

import {interval} from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import {createRoot, Root} from 'react-dom/client';
import {OptionsModel, OptionsModelKeys} from '../src/app/models/options.model';
import {ModifierEnum} from '../src/app/models/modifier.enum';
import {LookupModel} from '../src/app/models/lookup.model';
import {Lookup} from '../src/app/lookup/Lookup';
import {lookupPopupStyles} from '../src/app/lookup/lookup-styles';

export interface LookupCoord {
    pageX: number;
    pageY: number;
    x: number;
    y: number;
}

export interface LookupElementData {
    command: 'lookupElement';
    lookupWord: string;
    definitions: LookupModel[];
    coord: LookupCoord;
}

export class RuntimeListener {

    toShadow?: HTMLElement;
    shadow?: ShadowRoot;
    reactRoot?: Root;
    lastData?: LookupElementData;
    options: OptionsModel = new OptionsModel();
    singleClickListenerActive = false;
    dblClickWithMeta = false;

    constructor() {
        this.initializeOptions();
        console.log('RuntimeListener');
    }

    // Get options and listen for changes
    initializeOptions() {
        chrome.storage.local.get(OptionsModelKeys,
            (results) => {
                this.options = new OptionsModel(results);
                if (this.options.lookupEnabled) {
                    this.enableLookup();
                }
            });
        chrome.storage.onChanged.addListener(
            (changes, namespace) => {
                console.log('Options changed', changes);
                for (const key in changes) {
                    if (OptionsModelKeys.indexOf(key) > -1) {
                        if (key === 'lookupEnabled') {
                            if (!changes.lookupEnabled.oldValue && changes.lookupEnabled.newValue) {
                                this.enableLookup();
                            } else if (changes.lookupEnabled.oldValue && !changes.lookupEnabled.newValue) {
                                this.disableLookup();
                            }
                        }
                        this.options[key] = changes[key].newValue;
                    }
                }
            });
    }


    // Set onMessage and double click listener to start lookup
    enableLookup() {
        chrome.runtime.onMessage.addListener(this.messagesListener);
        document.addEventListener('dblclick', this.lookupClickListener);
        document.addEventListener('selectionchange', this.selectionChangedListener);
    }

    // Remove onMessage and double click listener to stop lookup
    disableLookup() {
        document.removeEventListener('selectionchange', this.selectionChangedListener);
        document.removeEventListener('dblclick', this.lookupClickListener);
        chrome.runtime.onMessage.removeListener(this.messagesListener);
    }

    // Render the Lookup React component into a new shadow DOM (prevents page styling from affecting lookup modal)
    createLookupHtml(data: LookupElementData) {
        if (this.toShadow && this.shadow && this.lastData) {
            const rect = this.shadow.children[0].getBoundingClientRect();
            // Use the same coordinates if a word inside the lookup modal is looked up
            if (data.coord.x > rect.left && data.coord.x < rect.right
                && data.coord.y > rect.top && data.coord.y < rect.bottom) {
                data.coord = this.lastData.coord;
            }
            // Remove current lookup modal if one exists
            this.removeLookupHtml();
        }
        this.lastData = data;
        this.toShadow = document.createElement('div');
        // Set positioning of lookup modal on the page
        this.toShadow.setAttribute('style', `position: absolute; left: ${data.coord.pageX}px; top: ${data.coord.pageY}px; z-index: 9999;`);
        this.shadow = this.toShadow.attachShadow({mode: 'closed'});
        // The mount container must be the first child so getBoundingClientRect() above measures the popup
        const container = document.createElement('div');
        const style = document.createElement('style');
        style.textContent = lookupPopupStyles;
        this.shadow.appendChild(container);
        this.shadow.appendChild(style);
        this.reactRoot = createRoot(container);
        this.reactRoot.render(<Lookup lookupWord={data.lookupWord} definitions={data.definitions ?? []}/>);
        document.body.appendChild(this.toShadow);
        document.addEventListener('click', this.clickOutsideListener, false);
        this.dblClickWithMeta = false;
    }

    // Listener to remove lookup modal when click is outside of the box
    clickOutsideListener = (event: MouseEvent) => {
        if (this.toShadow && this.shadow) {
            const rect = this.shadow.children[0].getBoundingClientRect();
            if (event.x < rect.left || event.x > rect.right || event.y < rect.top || event.y > rect.bottom) {
                this.removeLookupHtml();
                document.removeEventListener('click', this.clickOutsideListener, false);
            }
        }
    };

    // Unmount the React root and remove the lookup modal from the page
    removeLookupHtml() {
        this.reactRoot?.unmount();
        this.reactRoot = undefined;
        if (this.toShadow && this.toShadow.parentNode) {
            this.toShadow.parentNode.removeChild(this.toShadow);
        }
        this.toShadow = undefined;
        this.shadow = undefined;
    }

    lookupClickListener = (event: MouseEvent) => {
        const query = this.getTrimmedSelection();
        if (query !== '') {
            let modifierSuccess = false;
            switch (this.options.lookupModifier) {
                case(ModifierEnum.dbl_click):
                    modifierSuccess = !event.ctrlKey && !event.altKey && !event.metaKey;
                    break;
                case(ModifierEnum.ctrl_dbl_click):
                    modifierSuccess = event.ctrlKey;
                    break;
                case(ModifierEnum.alt_dbl_click):
                    modifierSuccess = event.altKey;
                    break;
                case(ModifierEnum.meta_dbl_click):
                    modifierSuccess = event.metaKey;
                    break;
                case(ModifierEnum.ctrl_alt_dbl_click):
                    modifierSuccess = event.ctrlKey && event.altKey;
                    break;
            }
            if (modifierSuccess) {
                this.dblClickWithMeta = true;
                chrome.runtime.sendMessage({
                    command: 'lookup',
                    query: query,
                    coord: {pageX: event.pageX, pageY: event.pageY, x: event.x, y: event.y}
                });
            }
        }
    };

    messagesListener = (data, sender, sendResponse) => {
        console.log('onMessage', data);
        switch (data.command) {
            case 'openEmail': {
                console.log('Received command: ' + data.command);
                this.openEmail(data.email);
                sendResponse('success');
                break;
            }
            case 'lookupElement': {
                console.log('Received command: ' + data.command);
                this.createLookupHtml(data);
                sendResponse('success');
                break;
            }
            default: {
                console.log('Unknown command detected!');
                break;
            }
        }
    };

    selectionChangedListener = () => {
        const selection = window.getSelection()!;
        setTimeout(() => {
            if (!selection.isCollapsed && !this.singleClickListenerActive && !this.dblClickWithMeta) {
                this.singleClickListenerActive = true;
                document.addEventListener('click', this.lookupClickListener);
            } else if (selection.isCollapsed && this.singleClickListenerActive) {
                document.removeEventListener('click', this.lookupClickListener);
                this.singleClickListenerActive = false;
            }
        }, 100);
    };

    getTrimmedSelection() {
        const selection = String(window.getSelection());
        return selection.replace(/^\s+|\s+$/g, '');
    }

    openEmail(email): void {
        console.log('openEmail received: ' + email);

        const mailtoPath = 'mailto:' + email;
        let c = 0;
        if (chrome.tabs) {
            // In order to fix the issue with mailto, open a new tab and set the URL to the mailto path
            chrome.tabs.create({'url': mailtoPath}, function (tab) {
                interval(300).pipe(
                    takeWhile(() => c > 0))
                    .subscribe(i => {
                        c++;
                        if (tab.id !== undefined) chrome.tabs.remove(tab.id);
                    });
            });
        }
    }
}
