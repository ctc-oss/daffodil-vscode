//
// To run this file:
// tsc byteWrapper.ts && node ./byteWrapper.js
//

enum Encoding {
  Hex = 'hex',
  Dec = 'dec',
  Oct = 'oct',
  Bin = 'bin',
}

function wrapBytes(
  uint8Array: Uint8Array,
  bytesPerRow: number,
  encoding: Encoding
): string {
  let result = ''

  for (let i = 0; i < uint8Array.length; i += bytesPerRow) {
    const lineBytes = uint8Array.slice(i, i + bytesPerRow)
    const lineId = i / bytesPerRow

    let lineContent = ''
    for (let j = 0; j < lineBytes.length; j++) {
      const byte = lineBytes[j]
      const byteId = i + j
      const byteValue = formatByteValue(byte, encoding)

      lineContent += `<a id="${byteId}">${byteValue}</a>`
    }

    result += `<p id="${lineId}">${lineContent}</p>\n`
  }

  return result
}

function formatByteValue(byte: number, encoding: Encoding): string {
  switch (encoding) {
    case Encoding.Hex:
      return byte.toString(16).toUpperCase().padStart(2, '0')
    case Encoding.Dec:
      return byte.toString().padStart(3, '0')
    case Encoding.Oct:
      return byte.toString(8).padStart(3, '0')
    case Encoding.Bin:
      return byte.toString(2).padStart(8, '0')
    default:
      return ''
  }
}

function runTest(bytes: Uint8Array): void {
  // wrapBytes for each encoding
  for (const encoding of Object.values(Encoding)) {
    for (const bytesPerRow of [8, 16]) {
      const wrappedBytes = wrapBytes(bytes, bytesPerRow, encoding)
      console.log(`encoding: ${encoding}, bytesPerRow: ${bytesPerRow}`)
      console.log(wrappedBytes)
    }
  }
}

runTest(
  new Uint8Array([
    42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
  ])
)
