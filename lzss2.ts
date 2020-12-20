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
	
	// maximum size for the sliding window to grow to
	private static readonly MAX_WINDOW_SIZE : number = 4096;
	
	/*
	 * Takes in a string and compresses it
	 * return the compressed output as a base64 encoded string
	 */
	public static COMPRESS(s : string) : string {
		let sliding_window : string = ""; // define the sliding window
		
		let compressed_output : string = ""; // store the compressed output
		
		let sb : string = ""; // stringbuilder to store similar chains of characters
		
		// for each character in input string
		//for(const c of s) {
		for(let i : number = 0;i < s.length;i++) {
			let c : string = s[i];
			
			sb += c; // add the current character to the stringbuffer
			
			// while the sliding window includes the current stringbuffer
			if(sliding_window.includes(sb)) {
				continue; // skip loop iterations
			}
			
			// the matching string is the stringbuffer minus the non matching character
			let matching_string : string = sb.substring(0, sb.length - 1);
			
			// find the offset and length based on that
			let offset : number = sliding_window.indexOf(matching_string);
			let length : number = matching_string.length;
			
			// if the match length is greater than 0
			if(length > 0) {
				let compressed_chunk : string = `[${offset.toString(16)},${length.toString(16)}]`; // generate a compressed chunk
				
				// if the compressed chunk is more efficient to have
				if(length > compressed_chunk.length) {
					compressed_output += compressed_chunk; // add it to the compressed output and rewind the stringbuffer using continue
					sliding_window += matching_string; // add only the matching string to the sliding window, equal to the compressed chunk stuff
					sb = ""; // clear stringbuffer
					i--;
					continue; // re-run the loop
				} else { // else just add it to the compressed output normally
					compressed_output += matching_string;
					sliding_window += matching_string;
					sb = "";
					i--;
					continue;
				}
			} else { // if the length is 0 then add normally
				compressed_output += sb;
			}
			
			sliding_window += sb; // add the stringbuffer onto the sliding window now that it is no longer needed for processing
			
			// if the sliding window gets too big then slide it
			while(sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
				sliding_window = sliding_window.substring(1, sliding_window.length);
			}
			
			sb = ""; // reset the stringbuffer
		}
		
		// find the offset and length based on that
		let offset : number = sliding_window.indexOf(sb);
		let length : number = sb.length;
		
		// if the match length is greater than 0
		if(length > 0) {
			let compressed_chunk : string = `[${offset.toString(16)},${length.toString(16)}]`; // generate a compressed chunk
			
			// if the compressed chunk is more efficient to have
			if(length > compressed_chunk.length) {
				compressed_output += compressed_chunk; // add it to the compressed output and rewind the stringbuffer using continue
				sliding_window += sb; // add only the matching string to the sliding window, equal to the compressed chunk stuff
			} else { // else just add it to the compressed output normally
				compressed_output += sb;
				sliding_window += sb;
			}
		} else { // if the length is 0 then add normally
			compressed_output += sb;
		}
		
		//return btoa(compressed_output); // btoa converts the compressed output to base64
		return Buffer.from(compressed_output).toString('base64'); // special function for nodejs
	}
	
	/*
	 * Takes in a string and decompresses it
	 * returns the decompressed output
	 */
	public static DECOMPRESS(s : string) : string {
		let sliding_window : string = ""; // define the sliding window
		
		let decompressed_output : string = ""; // store the compressed output
		
		let sb : string = ""; // stringbuffer for decoding bracket sets
		
		let nodejs_string : string = Buffer.from(s, 'base64').toString(); // specific wrapper for nodejs
		
		for(const c of nodejs_string) {
			
			// decoding continue chain
			
			// third step, if the ending bracket is encountered, eventually clear the stringbuilder and operate on it as needed for decoding
			if(c == "]") {
				
				sb = sb.substring(1, sb.length); // remove the opening bracket used to start the chain
				let chunks : string[] = sb.split(","); // split the offset and length apart into 2 values
				
				// parse the hexadecimal back into numbers
				let offset : number = parseInt(chunks[0], 16);
				let length : number = parseInt(chunks[1], 16);
				
				// grab the decoded string from the sliding window
				let decoded_string : string = sliding_window.substring(offset, offset + length);
				
				// add it to the sliding window
				sliding_window += decoded_string;
				// add it to the decompressed output
				decompressed_output += decoded_string;
				
				// if the sliding window gets too big then slide it
				while(sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
					sliding_window = sliding_window.substring(1, sliding_window.length);
				}
				
				// reset the stringbuffer and skip to the next iteration
				sb = "";
				continue;
			}
			
			// second step, if the first step happened, keep adding characters to the stringbuilder
			if(sb != "") {
				sb += c;
				continue;
			}
			
			// first step, if we find an opening bracket, set stringbuilder to [ and redo the loop
			if(c == "[") {
				sb = c;
				continue;
			}
			
			sb = c;
			
			sliding_window += sb; // add the current stringbuffer onto the sliding window for building the decoding dictionary
			decompressed_output += sb; // add the stringbuffer to the decompressed output as well
			
			// if the sliding window gets too big then slide it
			while(sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
				sliding_window = sliding_window.substring(1, sliding_window.length);
			}
			
			sb = ""; // reset the stringbuffer
		}
		
		return decompressed_output;
	}
	
}