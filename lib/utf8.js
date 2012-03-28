// -----------------------------------------------------------------------------
// Functions for converting between primitive strings (assuming utf-16) and
// utf-8 encoded Uint8Arrays.
//
// For details on utf-8 https://tools.ietf.org/html/rfc3629
// For incomprehensible details on utf-16 probably see 
// http://www.unicode.org/faq/utf_bom.html#utf16-4 otherwise the wikipedia
// page is quite sane.  Apparently utf-16 is now defined by a distribution
// table rather than a simple algorithm.
//
// Other javascript libraries providing utf-8 encoding/decoding:
//   - https://github.com/davidflanagan/BufferView as part of a nice api
//     (I feel stupid not to have found this before working on my own)
//   - https://github.com/lautis/wtf8 a c++ implementation for v8
//
// Copyright (c) 2012 Ben Mather<bwhmather@gmail.com>
// -----------------------------------------------------------------------------

var utf8 = (function () {

    // Takes a normal string and creates a byte array containing a utf-8
    // encoded version
    var encode = function (str) {
        var i, len,
            c,
            low, high,
            utf8, idx;

        if ((typeof str !== "string") &&
           !(str instanceof String)) {
            throw new TypeError("expected String as first argument");
        }

        len = str.length;
        i = 0;

        utf8 = new Uint8Array(len * 4);
        idx = 0;

        while (i < len) {

            //
            //
            // Read next codepoint from input string
            //

            c = str.charCodeAt(i++);

            // if character contains the high part of surrogate pair attempt
            // to read the second part
            if (0xd800 <= c && c <= 0xdfff) {
                if (len-i < 1) {
                    throw new Error("unexpected end of string");
                }

                high = c - 0xd800;
                low = str.charCodeAt(i++) - 0xdc00;

                if (0 > low || low > 0x3ff) {
                    throw new Error("invalid character as second part of " +
                                    "surrogate pair");
                }

                c = (high << 10 | low) + 0x10000;

            }

            //
            //
            // Append the code point to the output array
            //

            if (c <= 0x7f) {
                //
                // 0xxx xxxx
                //

                utf8[idx++] = c;


            } else if (c <= 0x7ff) {
                //
                // 110x xxxx   10xx xxxx
                //

                utf8[idx++] = 0xc0 | ((c >>> 6));
                utf8[idx++] = 0x80 | ((c)        & 0x3f);


            } else if (c <= 0xffff) {
                //
                // 1110 xxxx   10xx xxxx   10xx xxxx
                //

                utf8[idx++] = 0xe0 | ((c >>> 12));
                utf8[idx++] = 0x80 | ((c >>> 6)  & 0x3f);
                utf8[idx++] = 0x80 | ((c)        & 0x3f);


            } else if (c <= 0x10ffff) {
                //
                // 1111 0xxx   10xx xxxx   10xx xxxx   10xx xxxx
                //

                utf8[idx++] = 0xf0 | ((c >>> 18));
                utf8[idx++] = 0x80 | ((c >>> 12) & 0x3f);
                utf8[idx++] = 0x80 | ((c >>> 6)  & 0x3f);
                utf8[idx++] = 0x80 | ((c)        & 0x3f);


            } else {
                throw new Error("character out of range");
            }
        }

        // TODO should this clone the string into a smaller buffer?
        return utf8.subarray(0, idx);
    };

    // Takes a Uint8Array containing a utf-8 string and writes it's contents to
    // a new primitive utf-16 string.
    //
    // The `strict` argument is not required and defaults to true.
    // If false individually encoded surrogate pairs do not cause an exception
    // and neither do characters with unneeded bytes
    var decode = function (utf8, strict) {
        var i, len,
            c0, c1, c2, c3,
            code_point,
            str;

        // default to strict
        if (strict === undefined) {
            strict = true;
        }


        if (!(utf8 instanceof Uint8Array)) {
            throw new TypeError("expected Uint8Array");
        }

        str = "";
        len = utf8.length;
        i = 0;
        while (i < len) {

            //
            //
            // Read next code point from input array
            //

            c0 = utf8[i++];
            if (!(c0 & 0x80)) {
                //
                // 0xxx xxxx
                //

                code_point = c0;


            } else if (!((c0 & 0xe0) ^ 0xc0)) {
                //
                // 110x xxxx   10xx xxxx
                //

                if (len-i < 1) {
                    throw new Error("unexpected end of string");
                }
                // if no data in first byte then one less byte should be used
                if (!(c0 & 0x1e) && strict) {
                    throw new Error("character in non canonical form");
                }


                c1 = utf8[i++];
                // c1 should be of format 10xx xxxx
                if (!((c1 & 0xe0) ^ 0xc0)) {
                    throw new Error("invalid character");
                }

                code_point = (((c0 & 0x1f) << 6) |
                               (c1 & 0x3f));


            } else if (!((c0 & 0xf0) ^ 0xe0)) {
                //
                // 1110 xxxx  10xx xxxx  10xx xxxx
                //

                if (len-i < 2) {
                    throw new Error("unexpected end of string");
                }


                c1 = utf8[i++];
                // c1 should be of format 10xx xxxx
                if (!((c1 & 0xe0) ^ 0xc0)) {
                    throw new Error("invalid character");
                }

                c2 = utf8[i++];
                // c2 should be of format 10xx xxxx
                if (!((c2 & 0xe0) ^ 0xc0)) {
                    throw new Error("invalid character");
                }


                // if no data in first byte or first bit of second byte then
                // first byte is redundant
                if (!(c0 & 0x0f) && !(c1 & 0x20) && strict) {
                    throw new Error("character in non canonical form");
                }

                code_point = (((c0 & 0x0F) << 12) |
                              ((c1 & 0x3F) << 6)  |
                              ((c2 & 0x3F) << 0));


            } else if (!((c0 & 0xf8) ^ 0xf0)) {
                //
                // 1111 0xxx  10xx xxxx  10xx xxxx  10xx xxxx
                //

                if (len-i < 3) {
                    throw new Error("unexpected end of string");
                }


                c1 = utf8[i++];
                // c1 should be of format 10xx xxxx
                if (!((c1 & 0xe0) ^ 0xc0)) {
                    throw new Error("invalid character");
                }

                c2 = utf8[i++];
                // c2 should be of format 10xx xxxx
                if (!((c2 & 0xe0) ^ 0xc0)) {
                    throw new Error("invalid character");
                }

                c3 = utf8[i++];
                // c2 should be of format 10xx xxxx
                if (!((c3 & 0xe0) ^ 0xc0)) {
                    throw new Error("invalid character");
                }


                // if no data in first byte or first two bits of second byte then
                // first byte is redundant
                if (!(c0 & 0x0e) && !(c1 & 0x30) && strict) {
                    throw new Error("character in non canonical form");
                }

                code_point = (((c0 & 0x0F) << 18) |
                              ((c1 & 0x3F) << 12) |
                              ((c2 & 0x3F) << 6)  |
                              ((c3 & 0x3F) << 0));


            } else {
                throw new Error("invalid character");
            }

            //
            //
            // Append code point to output string, possibly as a surrogate pair
            //

            if (0xd800 <= code_point && code_point <= 0xdfff && strict) {
                throw new Error("utf8 encodes code point reserved for utf16");
            }

            if (code_point <= 0xffff) {
                // code points less than 16 bits chan be encoded in utf-16 as a
                // single character

                str += String.fromCharCode(code_point);


            } else if (0x10000 <= code_point && code_point <= 0x10ffff) {
                // code points greater than that (up to a maximum of 0x10ffff)
                // are encoded as a surrogate pair

                code_point -= 0x10000;

                // store first ten bytes in high surrogate
                str += String.fromCharCode((code_point >>> 10) + 0xd800);

                // store second ten bytes in low surrogate
                str += String.fromCharCode((code_point & 0x3ff) + 0xdc00);


            } else {
                throw new Error("illegal code point: ", code_point);
            }


        }

        return str;
    };


    return {
        encode: encode,
        decode: decode
    };

}());

