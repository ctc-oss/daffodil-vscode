/*
 * Licensed to the Apache Software Foundation (ASF under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License Version 2.0
 * (the "License"; you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Maps attributes to their hover tip
const attributeHoverMap: Map<string, string> = new Map([
  ['name', 'specify name'],
  ['ref', 'Specifies the name of an element in this schema'],
  ['minOccurs', 'Minimum number of times element will occur'],
  ['maxOccurs', 'Maximum number of times element will occur'],
  [
    'dfdl:occursCount',
    'dfdl:occursCount property takes an expression which commonly looks in the Infoset via an expression to obtain the count from another element.',
  ],
  [
    'dfdl:byteOrder',
    'This property applies to all Number Calendar (date and time and Boolean types with representation binary',
  ],
  ['dfdl:bitOrder', 'Determines the specific bits of any grammar region'],
  [
    'dfdl:occursCountKind',
    'Specifies how the actual number of occurrences is to be established',
  ],
  [
    'dfdl:length',
    'length can be an expression that resolves to an unsigned integer or a literal unsigned integer',
  ],
  [
    'dfdl:lengthKind',
    'lengthKind can be delimited fixed explicit implicit prefixedpattern or endOfParent',
  ],
  [
    'dfdl:prefixIncludesPrefixLength',
    'Specifies whether the length given by a prefix includes the length of the prefix as well as the length of the content region',
  ],
  [
    'dfdl:prefixLengthType',
    'Name of a simple type derived from xs:integer or any subtype of it.',
  ],
  [
    'dfdl:utf16Width',
    'Specifies whether the encoding UTF-16 is treated as a fixed or variable width encoding',
  ],
  [
    'dfdl:encoding',
    'This property can be computed by way of an expression which returns an appropriate string value',
  ],
  [
    'dfdl:encodingErrorPolicy',
    'This property provides control of how decoding and encoding errors are handled when converting the data to text or text to data',
  ],
  [
    'dfdl:nilKind',
    'Specifies how dfdl:<nilValue> is interpreted to represent the nil value in the data stream',
  ],
  [
    'dfdl:nilValue',
    'Used to provide a logical value that is used to indicate the data is nilled',
  ],
  [
    'dfdl:nilValueDelimiterPolicy',
    'Controls whether matching one of the nil values also involves matching the initiator or terminator specified by the element',
  ],
  [
    'dfdl:useNilForDefault',
    'Controls whether to set the Infoset item [nilled] boolean member or to use the XSD default or fixed properties to obtain a data value',
  ],
  [
    'dfdl:alignment',
    "Alignment required for the beginning of the item.\nCan be non-negative integer or 'implicit'.",
  ],
  [
    'dfdl:lengthUnits',
    'lengthUnits can be specified as bits bytes or characters',
  ],
  [
    'dfdl:lengthPattern',
    'lengthPattern takes a regular expression which is used to scan the data stream for matching data',
  ],
  [
    'dfdl:inputValueCalc',
    'An expression that calculates the value of the element when parsing',
  ],
  [
    'dfdl:outputValueCalc',
    'An expression that calculates the value of the current element when unparsing',
  ],
  [
    'dfdl:alignmentUnits',
    "Scales the alignment.\nCan only be used when alignment is bits or bytes.\nValid values are 'bits or 'bytes'.",
  ],
  [
    'dfdl:outputNewLine',
    'Specifies the character or characters that are used to replace the %NL; character class entity during unparse',
  ],
  ['dfdl:choiceBranchKey', 'List of DFDL String Literals'],
  [
    'dfdl:representation',
    'Identifies the physical representation of the element as text or binary',
  ],
  ['dfdl:textStringJustification', 'Specifies the string justification'],
  ['dfdl:textStringPadCharacter', 'Specifies the string justification'],
  [
    'dfdl:textStandardZeroRep',
    'Specifies the whitespace separated list of alternative DFDL String Literals that are equivalent to zero ',
  ],
  ['dfdl:textStandardInfinityRep', 'The value used to represent infinity.'],
  [
    'dfdl:textStandardExponentRep',
    'Defines the actual character(s that appear in the data as the exponent indicator',
  ],
  ['dfdl:textStandardNaNRep', 'Specifies the value used to represent NaN'],
  [
    'dfdl:textNumberPattern',
    'Indicates whether an xs:decimal element is signed',
  ],
  [
    'dfdl:decimalSigned',
    'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding',
  ],
  [
    'dfdl:textNumberRep',
    'Represented as standard characters in the character set encoding or represented as a zoned decimal in the character set encoding',
  ],
  [
    'dfdl:textNumberJustification',
    'Controls how the data is padded or trimmed on parsing and unparsing',
  ],
  [
    'dfdl:textNumberRoundingMode',
    'Specifies how rounding occurs during unparsing',
  ],
  [
    'dfdl:textNumberRoundingIncrement',
    'Specifies the rounding increment to use during unparsing',
  ],
  [
    'dfdl:textNumberRounding',
    'Specifies how rounding is controlled during unparsing',
  ],
  [
    'dfdl:textNumberCheckPolicy',
    'Indicates how lenient to be when parsing against the dfdl:textNumberPattern',
  ],
  [
    'dfdl:textOutputMinLength',
    'Specifies the minimum content length during unparsing for simple types that do not allow the XSD minLength facet to be specified',
  ],
  [
    'dfdl:textStandardDecimalSeparator',
    'Defines a whitespace separated list of single characters that appear (individually in the data as the decimal separator',
  ],
  [
    'dfdl:textStandardGroupingSeparator',
    'Specifies the single character that can appear in the data as the grouping separator',
  ],
  ['dfdl:textPadKind', 'Indicates whether to pad the data value on unparsing'],
  ['dfdl:textStandardBase', 'Indicates the number base'],
  [
    'dfdl:textZonedSignStyle',
    'Specifies the code points that are used to modify the sign nibble of the byte containing the sign',
  ],
  ['dfdl:textTrimKind', 'Indicates whether to trim data on parsing'],
  [
    'dfdl:textBooleanTrueRep',
    'A whitespace separated list of representations to be used for true',
  ],
  [
    'dfdl:textBooleanFalseRep',
    'A whitespace separated list of representations to be used for false',
  ],
  [
    'dfdl:textBooleanJustification',
    'Controls how the data is padded or trimmed on parsing and unparsing',
  ],
  [
    'dfdl:textBooleanPadCharacter',
    'The value that is used when padding or trimming boolean elements',
  ],
  [
    'dfdl:leadingSkip',
    'A non-negative number of bytes or bits to skip before alignment is applied',
  ],
  [
    'dfdl:trailingSkip',
    'A non-negative number of bytes or bits to skip after the element',
  ],
  [
    'dfdl:truncateSpecifiedLengthString',
    'This property provides the means to express an error or the strings can be truncated to fit when the strings in an Infoset being unparsed do not fit within those specified lengths',
  ],
  [
    'dfdl:sequenceKind',
    'Defines whether the items are expected in the same order that they appear in the schema or in any order',
  ],
  [
    'dfdl:separator',
    'Specifies a whitespace separated list of alternative DFDL String Literals that are the possible separators for the sequence',
  ],
  [
    'dfdl:separatorPosition',
    'specifies where the separator occurs between the elements',
  ],
  [
    'dfdl:separatorSuppressionPolicy',
    'Controls the circumstances when separators are expected in the data when parsing or generated when unparsing',
  ],
  [
    'dfdl:terminator',
    'charater or bytes found in the input stream that designate termination of an element',
  ],
  [
    'dfdl:textBidi',
    'This property exists in anticipation of future DFDL features that enable bidirectional text processing',
  ],
  ['dfdl:hiddenGroupRef', 'Reference to a global model group definition'],
  [
    'dfdl:choiceLengthKind',
    'Determines whether the branches of the choice are always filled (explicit to the fixed-length specified by dfdl:choiceLength or not filled (implicit',
  ],
  [
    'dfdl:choiceLength',
    'Specifies the length of the choice in bytes only used when dfdl:choiceLengthKind is explicit',
  ],
  [
    'dfdl:fillByte',
    'A single byte specified as a DFDL byte value entity or a single character used on unparsing to fill empty space',
  ],
  [
    'dfdl:ignoreCase',
    'Whether mixed case data is accepted when matching delimiters and data values on input',
  ],
  [
    'dfdl:initiatedContent',
    'yes indicates all branches of a choice are initiated\nno indicates the branch dfdl:initator property may be ste to empty string',
  ],
  [
    'dfdl:initiator',
    'Specifies an ordered whitespace separated list of alternative DFDL String Literals one of which marks the beginning of the element or group of elements ',
  ],
  [
    'dfdl:choiceDispatchKey',
    'The expression must evaluate to a string the string must match one of the dfdl:choiceBranchKey property values of one of the branches of the choice',
  ],
  ['dfdl:binaryNumberRep', 'binarypackedbcd or ibm4690Packed'],
  ['dfdl:floating', 'yes or no'],
  ['dfdl:binaryFloatRep', 'ieee or ibm390Hex'],
  [
    'dfdl:binaryDecimalVirtualPoint',
    'An integer that represents the position of an implied decimal point within a number',
  ],
  [
    'dfdl:binaryPackedSignCodes',
    'A whitespace separated string giving the hex sign nibbles to use for a positive value a negative value an unsigned value and zero',
  ],
  [
    'dfdl:binaryNumberCheckPolicy',
    'Indicates how lenient to be when parsing binary numbers',
  ],
  [
    'dfdl:binaryBooleanTrueRep',
    'A binary xs:unsignedInt gives the representation for true',
  ],
  [
    'dfdl:binaryBooleanFalseRep',
    'A binary xs:unsignedInt gives the representation for false',
  ],
  [
    'dfdl:calendarPattern',
    'Defines the ICU pattern that describes the format of the calendar. The pattern defines where the year month day hour minute second fractional second and time zone components appear',
  ],
  [
    'dfdl:calendarPatternKind',
    'The pattern is given by dfdl:calendarPattern explicit or the pattern is derived from the XML schema date/time type (implicit',
  ],
  [
    'dfdl:calendarCheckPolicy',
    'Indicates how lenient to be when parsing against the pattern',
  ],
  [
    'dfdl:calendarTimeZone',
    'Provides the time zone that is assumed if no time zone explicitly occurs in the data',
  ],
  [
    'dfdl:calendarObserveDST',
    'Whether the time zone given in dfdl:calendarTimeZone observes daylight savings time',
  ],
  [
    'dfdl:calendarFirstDayOfWeek',
    'The day of the week upon which a new week is considered to start',
  ],
  [
    'dfdl:calendarDaysInFirstWeek',
    'Specify the number of days of the new year that must fall within the first week',
  ],
  [
    'dfdl:calendarCenturyStart',
    'specifies the two digits that start a 100-year window that contains the current year',
  ],
  [
    'dfdl:calendarLanguage',
    'The language that is used when the pattern produces a presentation in text',
  ],
  [
    'dfdl:documentFinalTerminatorCanBeMissing',
    'Specifies whether the final line can be missing',
  ],
  [
    'dfdl:emptyValueDelimiterPolicy',
    'Indicates which of initiator terminator both or neither must be present when an element in the data stream is empty.',
  ],
  [
    'dfdl:emptyElementParsePolicy',
    'Indicates which of initiator terminator both or neither must be present when an element in the data stream is empty.',
  ],
  [
    'dfdl:escapeSchemeRef',
    'Refers to a named escape scheme definition via its qualified name',
  ],
  [
    'dfdl:escapeKind',
    'The type of escape mechanism defined in the escape scheme',
  ],
  [
    'dfdl:escapeCharacter',
    'Specifies one character that escapes the subsequent character',
  ],
  [
    'dfdl:escapeBlockStart',
    'The string of characters that denotes the beginning of a sequence of characters escaped by a pair of escape strings',
  ],
  [
    'dfdl:escapeBlockEnd',
    'The string of characters that denotes the end of a sequence of characters escaped by a pair of escape strings',
  ],
  [
    'dfdl:escapeEscapeCharacter',
    'Specifies one character that escapes an immediately following dfdl:escapeCharacter',
  ],
  [
    'dfdl:extraEscapedCharacters',
    'A whitespace separated list of single characters that must be escaped in addition to the in-scope delimiters',
  ],
  [
    'dfdl:generateEscapeBlock',
    'The type of escape mechanism defined in the escape scheme',
  ],
  [
    'dfdl:escapeCharacterPolicy',
    'The type of escape mechanism defined in the escape scheme',
  ],
  [
    'testKind',
    'Specifies whether a DFDL expression or DFDL regular expression pattern is used in the dfdl:assert',
  ],
  ['test', 'A DFDL expression that evaluates to true or false.'],
  [
    'testPattern',
    'A DFDL regular expression that is applied against the data stream',
  ],
  ['message', 'Defines text for use in an error message'],
  [
    'failureType',
    'Specifies the type of failure that occurs when the dfdl:assert is unsuccessful',
  ],
  ['schemaLocation', 'Specifies the location of the schema'],
  [
    'namespace',
    'User defined identifier for the namespace defined by schemaLocation value',
  ],
])

/**
 * Retrieves the hover value (definition or description) for a given attribute name.
 *
 * @param attributeName - The name of the attribute to look up.
 * @returns The hover value associated with the attribute, or 'No definition available' if not found.
 */
export function attributeHoverValues(attributeName: string): string {
  return attributeHoverMap.get(attributeName) ?? 'No definition available'
}

/**
 * Checks if a given attribute name has a corresponding hover value defined in the attribute hover map.
 *
 * @param attributeName - The name of the attribute to check.
 * @returns `true` if the attribute has a hover value; otherwise, `false`.
 */
export function hasAttributeHoverValue(attributeName: string): boolean {
  return attributeHoverMap.has(attributeName)
}
