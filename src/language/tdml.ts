/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * TDML (Test Data Markup Language) Language Support Module
 *
 * This module provides language support for TDML test files, which are used to
 * define test cases for DFDL schemas. TDML allows specification of:
 * - Input data (binary or text) for parsing tests
 * - Expected parse results (infoset)
 * - Expected unparse results (data)
 * - Test case configuration and parameters
 *
 * Language features include:
 * - Element and attribute completion for TDML-specific constructs
 * - Attribute value suggestions (test types, encoding names, etc.)
 * - Hover documentation for TDML elements and attributes
 * - Auto-closing of XML tags
 */

import * as vscode from 'vscode'
import * as fs from 'fs'
import { getTDMLElementCompletionProvider } from './providers/elementCompletion'
import { getTDMLAttributeCompletionProvider } from './providers/attributeCompletion'
import { getTDMLCloseElementProvider } from './providers/closeElement'
import { getTDMLAttributeValueCompletionProvider } from './providers/attributeValueCompletion'
import { getTDMLCloseElementSlashProvider } from './providers/closeElementSlash'

/**
 * Activates TDML language features and registers all language service providers.
 *
 * This function sets up language support specifically for TDML test files by:
 * 1. Registering completion providers for TDML elements, attributes, and values
 * 2. Setting up hover providers for showing TDML documentation
 * 3. Enabling auto-closing tag functionality for XML elements
 *
 * TDML files follow the XML format and contain test definitions for DFDL parsers.
 *
 * @param context - VS Code extension context for managing subscriptions and resources
 */
export function activate(context: vscode.ExtensionContext) {
  // Load the TDML format schema file which contains the structure
  // definitions for TDML test case elements
  let tdmlFormat = fs
    .readFileSync(
      context.asAbsolutePath(
        './src/language/providers/intellisense/TDMLGeneralFormat.tdml.xsd'
      )
    )
    .toLocaleString()

  // Register all TDML-specific language service providers
  // Each provider will be automatically disposed when the extension deactivates
  context.subscriptions.push(
    // Suggests valid TDML elements based on schema structure and current context
    getTDMLElementCompletionProvider(tdmlFormat),

    // Suggests TDML attribute names appropriate for the current element
    getTDMLAttributeCompletionProvider(),

    // Provides completion for TDML attribute values (test types, encodings, etc.)
    getTDMLAttributeValueCompletionProvider(),

    // Automatically inserts closing tags when user types '>'
    getTDMLCloseElementProvider(),

    // Handles self-closing tags when user types '/'
    getTDMLCloseElementSlashProvider()
  )
}
