Library for converting between native strings (assuming utf-16) and utf-8 encoded Uint8Arrays.
Surrogate pairs are correctly handled and an effort has been made to ensure that invalid data is detected immediately.


Installation
~~~~~~~~~~~~
No dependencies though you may wish to include a workaround for browsers that do not support typed arrays.

No compilation neccessary just copy utf8.js into your source tree and include it in the html file.


Usage
~~~~~
To convert from a string literal or object to utf-8 simply call:

    utf8.encode(string);

This function returns a Uint8Array based on a newly allocated ArrayBuffer sized to exactly fit the string.
Allocating and copying to this buffer takes less than five percent of the execution time of the function on my stem in both firefox and chrome.
In the event that the string is not valid utf-16, `utf8.encode` should throw an `Error` object with a hopefully reasonably helpfull message.

The reverse operation is:

    utf8.decode(utf8_uint8_array, strict)

The optional `strict` argument is a flag which indicates whether or not `utf8.decode` should reject characters encoded with more bytes than neccessary and characters reserved for utf-16 surrogate pairs.
By default it is set to `true` and the function will raise an `Error` on any illegal input.


Bugs
~~~~
None that I am aware of at the moment having tested in Firefox 11 and Chromium 18 under Linux on amd64.
Bug reports and/or pull requests welcome at https://github.com/bwhmather/js-utf8
If you have any problems I will do my best to help.

