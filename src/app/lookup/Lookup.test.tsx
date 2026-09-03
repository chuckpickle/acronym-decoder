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
import {Lookup} from './Lookup';
import {LookupModel} from '../models/lookup.model';

const definitions: LookupModel[] = [
    {
        acronym: 'API',
        definition: 'Application Programming Interface',
        links: [{name: 'Wikipedia', link: 'https://en.wikipedia.org/wiki/API'}],
        related: []
    },
    {
        acronym: 'API',
        definition: 'Active Pharmaceutical Ingredient',
        links: [],
        related: []
    }
];

describe('Lookup', () => {
    it('renders the word, definitions and links', () => {
        const {container} = render(<Lookup lookupWord="API" definitions={definitions}/>);

        expect(container.querySelector('.lookup-popup')).toBeInTheDocument();
        expect(container.querySelector('a.header')).toHaveTextContent('API');
        expect(screen.getByText('Application Programming Interface')).toBeInTheDocument();
        expect(screen.getByText('Active Pharmaceutical Ingredient')).toBeInTheDocument();
        expect(container.querySelectorAll('ol > li')).toHaveLength(2);

        const link = screen.getByRole('link', {name: 'https://en.wikipedia.org/wiki/API'});
        expect(link).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/API');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link.parentElement).toHaveTextContent('Wikipedia: https://en.wikipedia.org/wiki/API');
        expect(screen.queryByText('No definition found')).not.toBeInTheDocument();
    });

    it('renders "No definition found" for an empty list', () => {
        const {container} = render(<Lookup lookupWord="XYZ" definitions={[]}/>);

        expect(container.querySelector('.lookup-popup')).toBeInTheDocument();
        expect(screen.getByText('No definition found')).toBeInTheDocument();
        expect(container.querySelector('a.header')).toBeNull();
        expect(container.querySelector('ol')).toBeNull();
    });
});
