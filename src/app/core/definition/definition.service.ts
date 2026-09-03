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
import {LookupModel} from '../../models/lookup.model';
import {ConfigModel} from '../../models/config.model';
import {DatabaseType} from '../../models/database-type.enum';
import {LookupSource} from '../../models/lookup-source.enum';

interface RemoteLookupResponse {
    slurp: LookupModel[];
}

export class DefinitionService {

    // file names for chrome assets
    glossaryFileName = 'glossary.json';
    previousSearchTerm?: string;
    config?: ConfigModel;

    constructor(private readonly configurationService: ConfigurationService,
                private readonly fetchFn: typeof fetch = (...args) => fetch(...args)) {
        this.populateConfiguration().catch(error => {
            console.log('Error: ' + error);
        });
    }

    /**
     * Populates the configuration
     */
    populateConfiguration(): Promise<ConfigModel> {
        return this.configurationService.getConfiguration().then(config => {
            this.config = config;
            return config;
        });
    }

    /**
     * Routes the searching method by checking if the remote lookup is enabled or not
     *
     * @param searchTerm
     * @param source - used for analytics. It can be the popup search or on screen search
     */
    async lookupTerm(searchTerm: string, source: LookupSource): Promise<LookupModel[]> {
        console.log('Acronym Decoder is looking up: ' + searchTerm);

        const config = this.config ?? await this.populateConfiguration();
        if (config.enableRemoteLookup) {
            return this.lookupTermRemotely(searchTerm, source);
        } else {
            return this.lookupTermLocally(searchTerm, source);
        }
    }

    /**
     * Looks up the searched term from the local glossary file
     *
     * @param searchTerm
     * @param source - used for analytics. It can be the popup search or on screen search
     */
    async lookupTermLocally(searchTerm: string, source: LookupSource): Promise<LookupModel[]> {
        const glossary = await this.configurationService.getJsonFileContent<LookupModel[]>(this.glossaryFileName);
        this.previousSearchTerm = searchTerm;
        const definitions = glossary.filter(termObj =>
            termObj.acronym.toLowerCase() === searchTerm.toLowerCase()
        );
        this.gaLookupEvent(source, DatabaseType.local, searchTerm, definitions.length);

        console.log('Search results (locally): ', definitions);
        return definitions;
    }

    /**
     * Looks up the searched term by calling the lookup API. Rejects on a non-OK response.
     *
     * @param searchTerm
     * @param source
     */
    async lookupTermRemotely(searchTerm: string, source: LookupSource): Promise<LookupModel[]> {
        const lookupURL = this.config!.lookupApiUrl + searchTerm + '&dep=false';

        const response = await this.fetchFn(lookupURL).then(this.handleErrors);
        const json: RemoteLookupResponse = await response.json();
        const definitions = json.slurp;
        this.previousSearchTerm = searchTerm;
        this.gaLookupEvent(source, DatabaseType.server, searchTerm, definitions.length);
        console.log('Search results (remotely): ', definitions);
        return definitions;
    }

    handleErrors(response: Response): Response {
        if (!response.ok) throw Error(response.statusText);
        return response;
    }

    /**
     * Fires Google Analytics event
     */
    gaLookupEvent(lookupSource: LookupSource, databaseType: DatabaseType, term: string, numResults: number): void {

    }

}
