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
class DEFLATE2 {
    /*
     * Takes in a string and compresses it
     * return the compressed output as a base64 encoded string
     */
    static COMPRESS(s) {
        let sliding_window = ""; // define the sliding window
        let compressed_output = ""; // store the compressed output
        let sb = ""; // stringbuilder to store similar chains of characters
        // for each character in input string
        for (const c of s) {
            // if the sliding window gets too big then slide it
            while (sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
                sliding_window = sliding_window.substring(1, sliding_window.length);
            }
            // sliding_window = 109 | sb = 109 | c = 1
            if (sliding_window.includes(sb + c)) { // 109 includes 1091 x
                sb += c;
                continue;
            }
            else {
                let match_index = sliding_window.indexOf(sb); // 0
                let match_length = sb.length; // 3
                let pre_compressed_output = "";
                if (match_index != -1 && match_length > 0) { // there is a match, and there are contents in it, so compressed_output = [0, 3]
                    pre_compressed_output = `[${match_index.toString(16)},${match_length.toString(16)}]`;
                }
                else {
                    pre_compressed_output = sb; // this becomes 109
                }
                if (sb.length < pre_compressed_output.length) {
                    pre_compressed_output = sb;
                }
                compressed_output += pre_compressed_output;
                sliding_window += sb; // this becomes 109109
                sb = c; // this becomes 1
                continue;
            }
        }
        // final run through
        let match_index = sliding_window.indexOf(sb); // 0
        let match_length = sb.length; // 3
        let pre_compressed_output = "";
        if (match_index != -1 && match_length > 0) { // there is a match, and there are contents in it, so compressed_output = [0, 3]
            pre_compressed_output = `[${match_index.toString(16)},${match_length.toString(16)}]`;
        }
        else {
            pre_compressed_output = sb; // this becomes 109
        }
        if (sb.length < pre_compressed_output.length) {
            pre_compressed_output = sb;
        }
        compressed_output += pre_compressed_output;
        //console.log(compressed_output + "\n");
        return Buffer.from(compressed_output).toString('base64'); // special function for nodejs
    }
    /*
     * Takes in a string and decompresses it
     * returns the decompressed output
     */
    static DECOMPRESS(s) {
        let sliding_window = ""; // define the sliding window
        let decompressed_output = ""; // store the compressed output
        let sb = ""; // stringbuffer for decoding bracket sets
        let nodejs_string = Buffer.from(s, 'base64').toString(); // specific wrapper for nodejs
        let character_count = 0;
        for (const c of nodejs_string) {
            // if the sliding window gets too big then slide it
            while (sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
                sliding_window = sliding_window.substring(1, sliding_window.length);
            }
            if (c == '[' || sb != "") {
                sb += c;
            }
            if (sb == "") {
                character_count++;
                decompressed_output += c;
                sliding_window += c;
            }
            if (c == ']') {
                let split_coordinates = sb.split(',');
                let coordinate_position = parseInt(split_coordinates[0].substring(1, split_coordinates[0].length), 16);
                let coordinate_length = parseInt(split_coordinates[1].substring(0, split_coordinates[1].length - 1), 16);
                let sliding_window_pull = sliding_window.substring(coordinate_position, coordinate_position + coordinate_length);
                if (sliding_window_pull.length != coordinate_length) {
                    console.warn("Unable to get enough characters from the sliding window");
                    console.warn(`Tried to grab from characters ${coordinate_position} to ${coordinate_position + coordinate_length}, the maximum is ${DEFLATE2.MAX_WINDOW_SIZE}`);
                }
                sliding_window += sliding_window_pull;
                decompressed_output += sliding_window_pull;
                //console.log(sliding_window_pull.length);
                character_count += coordinate_length;
                //console.log(sliding_window_pull);
                //console.log(coordinate_position, coordinate_length);
                sb = "";
            }
        }
        //console.log(character_count);
        //console.log(decompressed_output.length);
        return decompressed_output;
    }
}
// maximum size for the sliding window to grow to
DEFLATE2.MAX_WINDOW_SIZE = 128;
/// <reference path="lzss2.ts" />
// includes get-pixels node module
const getPixels = require("get-pixels");
let fs = require('fs');
// holds the image file to be processed
const IMG_FILE = "kingpenguin.png";
let variable_name = IMG_FILE.split('.')[0];
// function to handle processing pixels
// takes in the pixels data structure
// returns nothing
function processPixels(pixels) {
    let bigData = pixels.data;
    let shape = pixels.shape;
    let width = shape[0];
    let height = shape[1];
    let depth = shape[2]; // RGB vs RGBA
    let built_string = "";
    let watchdog = 0;
    for (var i = 0; i < bigData.length; i++) {
        // this chunk skips anything after the blue in RGB
        if (watchdog > 2 && watchdog < depth) {
            watchdog++;
            continue;
        }
        if (watchdog >= depth) {
            watchdog = 0;
        }
        built_string += (bigData[i] + "").padStart(3, '0'); // pad with zeros to reach 3 total digits
        watchdog++;
    }
    //built_string = built_string.substr(0, 262);
    //console.log(built_string + "\n\n");
    console.log("LOADED");
    let compressed_string = DEFLATE2.COMPRESS(built_string); // compresses the image data
    let decompressed_string = DEFLATE2.DECOMPRESS(compressed_string);
    if (decompressed_string.length != built_string.length) {
        return console.log(`COMPRESSION FAILED ORIGINAL WAS ${built_string.length} BUT DECOMPRESSED WAS ${decompressed_string.length}`);
    }
    compressed_string = `TextureHouse.${variable_name}="${width}_${height}_RGB:${compressed_string}"`;
    fs.writeFile(`${variable_name}.js`, compressed_string, (err) => {
        if (err)
            return console.log(err);
    });
    console.log(compressed_string.length / built_string.length * 100);
    //console.log(pixels);
}
// gets the pixels from the image and runs processPixels
getPixels(IMG_FILE, (err, pixels) => {
    if (err) {
        console.log("BAD PATH");
        return;
    }
    processPixels(pixels);
});
