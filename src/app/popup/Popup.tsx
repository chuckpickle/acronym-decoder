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

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {ConfigurationService} from '../core/configuration/configuration.service';
import {useConfigurationService, useDefinitionService} from '../core/services-context';
import {ConfigModel} from '../models/config.model';
import {LookupModel} from '../models/lookup.model';
import {LookupSource} from '../models/lookup-source.enum';
import {openDefaultEmailAddress} from './open-default-email';
import './popup.css';

const SETTINGS_ICON_PATH =
    'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z';

export function Popup() {
    const configurationService = useConfigurationService();
    const definitionService = useDefinitionService();

    const [config, setConfig] = useState<ConfigModel | undefined>(undefined);
    const [extensionVersion, setExtensionVersion] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [previousSearchTerm, setPreviousSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<LookupModel[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        configurationService.getConfiguration().then(cfg => {
            if (mounted.current) setConfig(cfg);
        });
        configurationService.getExtensionVersion().then(version => {
            if (mounted.current) setExtensionVersion(version);
        });
        return () => {
            mounted.current = false;
        };
    }, [configurationService]);

    const isBackendOnline = ConfigurationService.isBackendOnline;

    function lookupTerm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setIsLoading(true);
        setPreviousSearchTerm(searchTerm.toUpperCase());
        definitionService.lookupTerm(searchTerm, LookupSource.popup).then(
            res => {
                if (!mounted.current) return;
                setIsLoading(false);
                setSearchResults(res);
            },
            () => {
                if (!mounted.current) return;
                setIsLoading(false);
                setSearchResults([]);
            }
        );
    }

    return (
        <div className="decoder">
            <div id="settings">
                <svg id="settingsIcon" fill="#000000" height="24" viewBox="0 0 24 24" width="24"
                     xmlns="http://www.w3.org/2000/svg" onClick={() => chrome.runtime.openOptionsPage()}>
                    <path d={SETTINGS_ICON_PATH}/>
                </svg>
            </div>
            <div className="header">
                <img id="icon" className="extension-icon" alt=""
                     src={isBackendOnline ? config?.onlineIconPath : config?.offlineIconPath}/>
            </div>
            <div className="text-center">
                <p id="description">Acronyms &amp; Terms - Decoded</p>
            </div>

            <form className="input-group" onSubmit={lookupTerm}>
                <input name="term" id="searchInput" type="text" className="form-control" value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       placeholder="Search for an acronym or a term" autoFocus autoComplete="off"/>

                <div className="input-group-btn">
                    <button type="submit" id="searchBtn" className="btn search-button button-border input-suffix"
                            aria-label="search" disabled={searchTerm === ''}>
                        <span className="material-icons">search</span>
                    </button>
                </div>
            </form>

            {isLoading && (
                <div className="spinner-container d-flex flex-column justify-content-center align-items-center">
                    <div className="spinner-border text-ad-accent" role="status" style={{width: 40, height: 40}}/>
                    <p>Looking up definitions for {previousSearchTerm}...</p>
                </div>
            )}

            {searchResults && !isLoading && (
                <div id="resultsBody">
                    {searchResults.length > 0 ? (
                        <div>
                            <h4 id="resultsHeader">{previousSearchTerm}:</h4>
                            <ol id="resultsTable">
                                {searchResults.map((item, index) => (
                                    <li key={index}>
                                        <p>{item.definition}</p>
                                        {item.links.map(linkObj => (
                                            <a key={linkObj.link} className="def-link" target="_blank"
                                               rel="noopener noreferrer" href={linkObj.link}>
                                                {linkObj.link}
                                            </a>
                                        ))}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : (
                        <h6 id="noResults">No matches found for "{previousSearchTerm}"!</h6>
                    )}
                </div>
            )}

            <div className="bottom-info">
                <hr/>
                <div className="text-center link">
                    <a id="email" onClick={() => config && openDefaultEmailAddress(config.contactEmail)}>
                        {config?.contactEmail}
                    </a>
                </div>

                <p id="version">v{extensionVersion}</p>
            </div>
        </div>
    );
}
