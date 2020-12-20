/*
 * LZSS Version 2
 * This improved version contains an optimized, encapsulated, better written
 * Compression functionality
 * Separated into 2 classes
 * 1 for the core compression functionality
 * 1 for extensions for improved compression time
 */
/*
 * Main compression technology class
 * Handles compression of strings of characters
 */
var DEFLATE2 = /** @class */ (function () {
    function DEFLATE2() {
    }
    /*
     * Takes in a string and compresses it
     * return the compressed output as a base64 encoded string
     */
    DEFLATE2.COMPRESS = function (s) {
        var sliding_window = ""; // define the sliding window
        var compressed_output = ""; // store the compressed output
        var sb = ""; // stringbuilder to store similar chains of characters
        // for each character in input string
        //for(const c of s) {
        for (var i = 0; i < s.length; i++) {
            var c = s[i];
            sb += c; // add the current character to the stringbuffer
            // while the sliding window includes the current stringbuffer
            if (sliding_window.includes(sb)) {
                continue; // skip loop iterations
            }
            // the matching string is the stringbuffer minus the non matching character
            var matching_string = sb.substring(0, sb.length - 1);
            // find the offset and length based on that
            var offset_1 = sliding_window.indexOf(matching_string);
            var length_1 = matching_string.length;
            // if the match length is greater than 0
            if (length_1 > 0) {
                var compressed_chunk = "[" + offset_1.toString(16) + "," + length_1.toString(16) + "]"; // generate a compressed chunk
                // if the compressed chunk is more efficient to have
                if (length_1 > compressed_chunk.length) {
                    compressed_output += compressed_chunk; // add it to the compressed output and rewind the stringbuffer using continue
                    sliding_window += matching_string; // add only the matching string to the sliding window, equal to the compressed chunk stuff
                    sb = ""; // clear stringbuffer
                    i--;
                    continue; // re-run the loop
                }
                else { // else just add it to the compressed output normally
                    compressed_output += matching_string;
                    sliding_window += matching_string;
                    sb = "";
                    i--;
                    continue;
                }
            }
            else { // if the length is 0 then add normally
                compressed_output += sb;
            }
            sliding_window += sb; // add the stringbuffer onto the sliding window now that it is no longer needed for processing
            // if the sliding window gets too big then slide it
            while (sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
                sliding_window = sliding_window.substring(1, sliding_window.length);
            }
            sb = ""; // reset the stringbuffer
        }
        // find the offset and length based on that
        var offset = sliding_window.indexOf(sb);
        var length = sb.length;
        // if the match length is greater than 0
        if (length > 0) {
            var compressed_chunk = "[" + offset.toString(16) + "," + length.toString(16) + "]"; // generate a compressed chunk
            // if the compressed chunk is more efficient to have
            if (length > compressed_chunk.length) {
                compressed_output += compressed_chunk; // add it to the compressed output and rewind the stringbuffer using continue
                sliding_window += sb; // add only the matching string to the sliding window, equal to the compressed chunk stuff
            }
            else { // else just add it to the compressed output normally
                compressed_output += sb;
                sliding_window += sb;
            }
        }
        else { // if the length is 0 then add normally
            compressed_output += sb;
        }
        return btoa(compressed_output); // btoa converts the compressed output to base64
    };
    /*
     * Takes in a string and decompresses it
     * returns the decompressed output
     */
    DEFLATE2.DECOMPRESS = function (s) {
        var sliding_window = ""; // define the sliding window
        var decompressed_output = ""; // store the compressed output
        var sb = ""; // stringbuffer for decoding bracket sets
        for (var _i = 0, _a = atob(s); _i < _a.length; _i++) {
            var c = _a[_i];
            // decoding continue chain
            // third step, if the ending bracket is encountered, eventually clear the stringbuilder and operate on it as needed for decoding
            if (c == "]") {
                sb = sb.substring(1, sb.length); // remove the opening bracket used to start the chain
                var chunks = sb.split(","); // split the offset and length apart into 2 values
                // parse the hexadecimal back into numbers
                var offset = parseInt(chunks[0], 16);
                var length_2 = parseInt(chunks[1], 16);
                // grab the decoded string from the sliding window
                var decoded_string = sliding_window.substring(offset, offset + length_2);
                // add it to the sliding window
                sliding_window += decoded_string;
                // add it to the decompressed output
                decompressed_output += decoded_string;
                // if the sliding window gets too big then slide it
                while (sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
                    sliding_window = sliding_window.substring(1, sliding_window.length);
                }
                // reset the stringbuffer and skip to the next iteration
                sb = "";
                continue;
            }
            // second step, if the first step happened, keep adding characters to the stringbuilder
            if (sb != "") {
                sb += c;
                continue;
            }
            // first step, if we find an opening bracket, set stringbuilder to [ and redo the loop
            if (c == "[") {
                sb = c;
                continue;
            }
            sb = c;
            sliding_window += sb; // add the current stringbuffer onto the sliding window for building the decoding dictionary
            decompressed_output += sb; // add the stringbuffer to the decompressed output as well
            // if the sliding window gets too big then slide it
            while (sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
                sliding_window = sliding_window.substring(1, sliding_window.length);
            }
            sb = ""; // reset the stringbuffer
        }
        return decompressed_output;
    };
    // maximum size for the sliding window to grow to
    DEFLATE2.MAX_WINDOW_SIZE = 4096;
    return DEFLATE2;
}());
