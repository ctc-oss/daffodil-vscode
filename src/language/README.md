# Intellisense

This document contains an overview of how intellisense works as well as a general view of the architecture of the code.

## Table of Contents

### General Intellisense Concepts

The VS Code API contains

### DFDL

This section focuses on the `dfdl` Intellisense implementation.

#### High-level dfdl Intellisense Overview

This section providers a high-level view of the architecture of all relevant code items pertaining to the `dfdl` IntelliSense functionality.

##### Provider Registration (Start Here)

`src/language/dfdl.ts` is the starting point. It wires up the extension’s language features by calling VS Code registration APIs (e.g., registerCompletionItemProvider, registerHoverProvider, and similar) that are then customized as functions that provide customized provider functinoality.

In other words, `dfdl.ts` connects the provider implementations to VS Code for the DFDL language.

##### Providers

Autocompletion logic is split into multiple provider modules under `src/language/providers/`, each handling different completion scenarios.

- `elementCompletion.ts` -- suggests child elements / element tags.
- `attributeCompletion.ts` -- suggests attribute names when inside an element.
- `attributeValueCompletion.ts` -- provides completion suggestions for attribute values (e.g., enumerated values).
- `closeElement.ts`, `closeElementSlash.ts` -- completions for closing tags and slash completions.
- `attributeHover.ts` -- hover provider that shows attribute documentation/available attributes.

##### Helpers + Vocabulary

`src/language/providers/utils.ts` and `src/language/providers/intellisense/commonItems.ts` contain shared helpers for constructing CompletionItem objects, and context parsing utilities used by many providers. For `src/language/providers/intellisense/commonItems.ts` and tracing through usage, it's used by `attributeCompletion.ts` and `elementCompletion.ts`.

`src/rootCompletion/utils.ts` contains utilities used for root-level completion logic (common completion primitives).

The code relies on project classes like schemaData (found under src/classes/schemaData.ts) and other "model" classes to know DFDL vocabulary (elements, attributes, properties). Those model classes hold the authoritative lists that the providers consult when building suggestions.

##### Context Parsing

Providers do lightweight parsing of the current document and cursor context (often using a small tokenizer / utility functions) to determine whether the cursor is:

- inside an element start tag
- inside attribute name or value
- within namespace/prefix context
- in text content (no suggestions)

This context detection guides which provider runs and how it filters suggestions.

##### Namespace / Prefix Handling

The code is able to determine the current element's namespace and the suggestions are able to insert the correct namespace or omit the namespace accordinly for attribute and element suggestions

##### Completions Construction

Providers build `vscode.CompletionItem` objects populated with:

- label, kind (element/attribute/snippet)
- insertText (text inserted when the user accepts the suggestion)
- sometimes additionalTextEdits or textEdit ranges to precisely replace text
- optional documentation or detail shown in the completion UI

Some items use resolveCompletionItem logic if additional data must be computed after selection.

##### Hover / Documentation

`attributeHover.ts` forms hover messages (Markdown strings) describing attributes available on a tag, DFDL property documentation, etc. Hover resolves current element context then gathers attribute docs and returns a `vscode.Hover` object.

Hover tooltips can be found under `attributeHoverValues()` in `attributeHoverItems.ts`.

##### Testing

`src/tests/suite/language/items.test.ts` contains unit-style checks that assert which items should be available in certain contexts -- useful to confirm the expected behavior of completion providers.

### TDML

This section focuses on the `tdml` Intellisense implementation. It should be noted that the functionality is currently unused.
