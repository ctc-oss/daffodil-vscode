//
// To run this file:
// tsc byteWrapper.ts && node ./byteWrapper.js
//
var Encoding;
(function (Encoding) {
    Encoding["Hex"] = "hex";
    Encoding["Dec"] = "dec";
    Encoding["Oct"] = "oct";
    Encoding["Bin"] = "bin";
})(Encoding || (Encoding = {}));
function wrapBytes(uint8Array, bytesPerRow, encoding) {
    var result = '';
    for (var i = 0; i < uint8Array.length; i += bytesPerRow) {
        var lineBytes = uint8Array.slice(i, i + bytesPerRow);
        var lineId = i / bytesPerRow;
        var lineContent = '';
        for (var j = 0; j < lineBytes.length; j++) {
            var byte = lineBytes[j];
            var byteId = i + j;
            var byteValue = formatByteValue(byte, encoding);
            lineContent += "<a id=\"".concat(byteId, "\">").concat(byteValue, "</a>");
        }
        result += "<p id=\"".concat(lineId, "\">").concat(lineContent, "</p>\n");
    }
    return result;
}
function formatByteValue(byte, encoding) {
    switch (encoding) {
        case Encoding.Hex:
            return byte.toString(16).toUpperCase().padStart(2, '0');
        case Encoding.Dec:
            return byte.toString().padStart(3, '0');
        case Encoding.Oct:
            return byte.toString(8).padStart(3, '0');
        case Encoding.Bin:
            return byte.toString(2).padStart(8, '0');
        default:
            return '';
    }
}
function runTest(bytes) {
    // wrapBytes for each encoding
    for (var _i = 0, _a = Object.values(Encoding); _i < _a.length; _i++) {
        var encoding = _a[_i];
        for (var _b = 0, _c = [8, 16]; _b < _c.length; _b++) {
            var bytesPerRow = _c[_b];
            var wrappedBytes = wrapBytes(bytes, bytesPerRow, encoding);
            console.log("encoding: ".concat(encoding, ", bytesPerRow: ").concat(bytesPerRow));
            console.log(wrappedBytes);
        }
    }
}
runTest(new Uint8Array([
    42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76,
]));
