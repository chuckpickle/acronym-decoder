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

import {createContext, useContext, useMemo, type ReactNode} from 'react';
import {ConfigurationService} from './configuration/configuration.service';
import {DefinitionService} from './definition/definition.service';

export interface Services {
    configurationService: ConfigurationService;
    definitionService: DefinitionService;
}

export function createServices(): Services {
    const configurationService = new ConfigurationService();
    const definitionService = new DefinitionService(configurationService);
    return {configurationService, definitionService};
}

const ServicesContext = createContext<Services | undefined>(undefined);

interface ServicesProviderProps {
    services?: Services;
    children: ReactNode;
}

/**
 * Replaces Angular's CoreModule DI. Wrap the app (or a component under test) in this
 * provider; pass `services` to inject stubs in tests.
 */
export function ServicesProvider({services, children}: ServicesProviderProps) {
    const value = useMemo(() => services ?? createServices(), [services]);
    return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
    const services = useContext(ServicesContext);
    if (!services) {
        throw new Error('useServices must be used within a <ServicesProvider>');
    }
    return services;
}

export function useConfigurationService(): ConfigurationService {
    return useServices().configurationService;
}

export function useDefinitionService(): DefinitionService {
    return useServices().definitionService;
}
