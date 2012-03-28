;(function() {
    //==========================================================================
    module("encode");
    //==========================================================================

    test("ascii", function() {
        deepEqual( utf8.encode("hello"),
                   Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]),
                   "hello");

        deepEqual( utf8.encode("\x00\x01\x13\x25\x37\x49\x5b\x6d\x7f"),
                   Uint8Array([0x00, 0x01, 0x13, 0x25, 0x37,
                               0x49, 0x5b, 0x6d, 0x7f]),
                   "lowest to highest");
    });

    test("two byte characters", function() {
        deepEqual( utf8.encode("\u0080"),
                   Uint8Array([0xc2, 0x80]),
                   "lowest two byte character");

        deepEqual( utf8.encode("\u07ff"),
                   Uint8Array([0xdf, 0xbf]),
                   "highest two byte character");

    });

    test("three byte characters", function() {
        deepEqual( utf8.encode("\u0800"),
                   Uint8Array([0xe0, 0xa0, 0x80]),
                   "lowest three byte character");

        deepEqual( utf8.encode("\ud7ff"),
                   Uint8Array([0xed, 0x9f, 0xbf]),
                   "lower edge of range reserved for utf16 pairs");

        deepEqual( utf8.encode("\ue000"),
                   Uint8Array([0xee, 0x80, 0x80]),
                   "upper edge of range reserved for utf16 pairs");

        deepEqual( utf8.encode("\uffff"),
                   Uint8Array([0xef, 0xbf, 0xbf]),
                   "highest three byte character");

    });

    test("four byte characters", function() {
        deepEqual( utf8.encode("\ud800\udc00"),
                   Uint8Array([0xf0, 0x90, 0x80, 0x80]),
                   "lowest four byte character");

        deepEqual( utf8.encode("\ud834\udd1e"),
                   Uint8Array([0xf0, 0x9d, 0x84, 0x9e]),
                   "G clef");

        deepEqual( utf8.encode("\udbff\udfff"),
                   Uint8Array([0xf4, 0x8f, 0xbf, 0xbf]),
                   "highest four byte character");
    });

    test("invalid input", function() {
        raises( function () {
                utf8.encode("\ud800\x68\x65\x6c\x6c\x6f");
            }, Error,
            "rejects incomplete surrogate pair");

        raises( function () {
                utf8.encode("\udfff\x68\x65\x6c\x6c\x6f");
            }, Error,
            "rejects incomplete surrogate pair");
    });


    //==========================================================================
    module("decode");
    //==========================================================================

    test("ascii", function() {

    });

    test("two byte characters", function() {
        deepEqual( utf8.decode(Uint8Array([0xc2, 0x80])),
                   "\u0080",
                   "lowest two byte character");

        deepEqual( utf8.decode(Uint8Array([0xdf, 0xbf])),
                   "\u07ff",
                   "highest two byte character");

        raises(function () {
                utf8.decode(Uint8Array([0xc1, 0xbf]));
            }, Error, "raises on unneeded first byte in two byte character");

        raises(function () {
                utf8.decode(Uint8Array([0xcf]));
            }, Error, "raises on truncated two byte character");

    });

    test("three byte characters", function() {
        deepEqual( utf8.decode(Uint8Array([0xe0, 0xa0, 0x80])),
                   "\u0800",
                   "lowest three byte character");

        deepEqual( utf8.decode(Uint8Array([0xef, 0xbf, 0xbf])),
                   "\uffff",
                   "highest three byte character");

        raises(function () {
                utf8.decode(Uint8Array([0xe0, 0x9f, 0xbf]));
            }, Error, "raises on unneeded first byte in three byte character");

        raises(function () {
                utf8.decode(Uint8Array([0xef, 0xbf]));
            }, Error, "raises on truncated three byte character");
    });

    test("four byte characters", function() {
        deepEqual( utf8.decode(Uint8Array([0xf0, 0x9d, 0x84, 0x9e])),
                   "\ud834\udd1e",
                   "G clef");

        raises(function () {
                utf8.decode(Uint8Array([0xf0, 0x8f, 0xbf, 0xbf]));
            }, Error, "raises on unneeded first byte in four byte character");

        raises(function () {
                utf8.decode(Uint8Array([0xf7, 0xbf, 0xbf]));
            }, Error, "raises on truncated four byte character");
    });

    test("invalid input", function() {
        raises(function () {
                utf8.decode(Uint8Array([0xed, 0xa0, 0x80]));
            }, Error,
            "raises on encoded surrogate pairs");

        raises(function () {
                utf8.decode(Uint8Array([0xed, 0xbf, 0xbf]));
            }, Error,
            "raises on encoded surrogate pairs");
    });


    //==========================================================================
    module("cross checks");
    //==========================================================================

    test("valid > encode | decode", function () {
        var c, cs;

        cs=""

        for(c=0; c <= 0xffff; c++) {
           if (c >= 0xd800 && c <= 0xdfff) continue;
           cs += String.fromCharCode(c);
        }

        deepEqual( utf8.decode(utf8.encode(cs)),
                   cs,
                   "encodes and decodes all valid bmp unicode characters");

    });

}());
