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

// Styles for the lookup popup. Kept as a string (rather than a .css import) because the
// component is rendered inside a closed shadow root by the content script, where page-level
// stylesheets do not apply and the webpack bundle has no CSS loader.
export const lookupPopupStyles = `
.lookup-popup {
    min-width: 300px;
    max-width: 600px;
    padding: 20px;
    padding-top: 10px;
    background: #ffffff;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}
a.header {
    font-weight: bold;
    font-size: 18px;
    color: black;
    text-decoration: none;
}
ol, p {
    font-size: 14px;
}
ul li {
    list-style-type: square;
}
`;
