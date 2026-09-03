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

import {useEffect, useRef, useState} from 'react';
import {useConfigurationService} from '../core/services-context';
import {ConfigModel} from '../models/config.model';
import {ModifierEnum} from '../models/modifier.enum';
import {OptionsModel, OptionsModelKeys} from '../models/options.model';
import {sanitizeUrl} from './sanitize-url';
import './homepage.scss';

const MODIFIER_LABELS: Record<ModifierEnum, string> = {
    [ModifierEnum.dbl_click]: 'Only Double Click',
    [ModifierEnum.ctrl_dbl_click]: 'Ctrl + Double Click',
    [ModifierEnum.alt_dbl_click]: 'Alt + Double Click',
    [ModifierEnum.meta_dbl_click]: 'Command + Double Click',
    [ModifierEnum.ctrl_alt_dbl_click]: 'Ctrl + Alt + Double Click',
};

const SAVING_SPINNER_DELAY = 2000;

export function Homepage() {
    const configurationService = useConfigurationService();
    const [config, setConfig] = useState<ConfigModel>();
    const [extensionVersion, setExtensionVersion] = useState('');
    const [options, setOptions] = useState<OptionsModel>(new OptionsModel());
    const [savingOptions, setSavingOptions] = useState(false);
    const [optionsSaved, setOptionsSaved] = useState(false);
    const savingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        configurationService.getConfiguration().then(setConfig);
        configurationService.getExtensionVersion().then(setExtensionVersion);
        chrome.storage.local.get(OptionsModelKeys, (result: Partial<OptionsModel>) => {
            setOptions(new OptionsModel(result));
        });
    }, [configurationService]);

    useEffect(() => () => clearTimeout(savingTimer.current), []);

    const optionsChanged = () => {
        setOptionsSaved(false);
        setSavingOptions(false);
    };

    const updateOptions = (changes: Partial<OptionsModel>) => {
        setOptions(current => new OptionsModel({...current, ...changes}));
        optionsChanged();
    };

    const saveOptions = () => {
        setOptionsSaved(false);
        setSavingOptions(true);
        /* Unknown issue where the callback is extremely slow even after changes have been
         * picked up by the content-script, sometimes the callback is not fired at all, so
         * the spinner below is faked instead of driven by it.
         */
        chrome.storage.local.set(options, () => {
        });
        clearTimeout(savingTimer.current);
        savingTimer.current = setTimeout(() => {
            setSavingOptions(false);
            setOptionsSaved(true);
        }, SAVING_SPINNER_DELAY);
    };

    const slackChannelNativeUrl = sanitizeUrl(config?.slackChannelLink);

    return (
        <div id="decoderOptions">
            <div id="optionsContainer">
                <div className="text-center">
                    <img id="icon" className="logo" src={config?.mainIconPath}/>

                    <p id="version">v{extensionVersion}</p>
                </div>
                <div className="options-box">
                    <div className="options-info">
                        <p>
                            Your input makes Acronym Decoder smarter! Please send feedback on wrong/missing definitions
                            or this tool in general to{' '}
                            <a href={`mailto:${config?.contactEmail ?? ''}`}>{config?.contactEmail}</a>
                        </p>
                        <p>
                            For more info on Acronym Decoder and how to use it, visit our{' '}
                            <a href={sanitizeUrl(config?.extensionInfoPageLink)} target="_blank"
                               rel="noopener noreferrer">
                                {config?.extensionInfoPageName}
                            </a>
                            {' '}or join our Slack channel{' '}
                            <a href={slackChannelNativeUrl}>
                                {config?.slackChannelName}
                            </a>
                        </p>
                    </div>
                    <hr/>
                    <h4>Options</h4>
                    <hr/>
                    <div className="d-flex flex-row justify-content-evenly align-items-center">
                        <h6 className="w-50">On page lookup:</h6>
                        <select className="form-select w-50" aria-label="On page lookup"
                                value={String(options.lookupEnabled)}
                                onChange={event => updateOptions({lookupEnabled: event.target.value === 'true'})}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                    <div className="d-flex flex-row justify-content-evenly align-items-center">
                        <h6 className="w-50">Mouse click modifier:</h6>
                        <select className="form-select w-50" aria-label="Mouse click modifier"
                                value={String(options.lookupModifier)}
                                onChange={event => updateOptions({lookupModifier: Number(event.target.value)})}>
                            {Object.entries(MODIFIER_LABELS).map(([modifier, label]) => (
                                <option key={modifier} value={modifier}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex flex-row justify-content-evenly align-items-center">
                        <h6 className="w-50">&quot;Definition Not Found&quot; dialog:</h6>
                        <select className="form-select w-50" aria-label="&quot;Definition Not Found&quot; dialog"
                                value={String(options.notFoundDialog)}
                                onChange={event => updateOptions({notFoundDialog: event.target.value === 'true'})}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
                    <hr/>
                    <div className="d-flex justify-content-center">
                        <button type="button" id="saveOptions"
                                className={`btn save-options ${savingOptions || optionsSaved ? 'btn-ad-primary' : 'btn-ad-accent'}`}
                                onClick={saveOptions}>
                            {!savingOptions && !optionsSaved && <span>Save</span>}
                            {savingOptions && <span>Saving
                                <span className="spinner-border on-right" role="status"
                                      style={{width: 18, height: 18}}/></span>}
                            {optionsSaved && <span>Saved <span className="material-icons on-right">check</span></span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
