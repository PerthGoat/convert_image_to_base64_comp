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
	private static readonly MAX_WINDOW_SIZE : number = 128;
	
	/*
	 * Takes in a string and compresses it
	 * return the compressed output as a base64 encoded string
	 */
	public static COMPRESS(s : string) : string {
		let sliding_window : string = ""; // define the sliding window
		
		let compressed_output : string = ""; // store the compressed output
		
		let sb : string = ""; // stringbuilder to store similar chains of characters
		
		// for each character in input string
		for(const c of s) {
      // if the sliding window gets too big then slide it
			while(sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
				sliding_window = sliding_window.substring(1, sliding_window.length);
			}
      // sliding_window = 109 | sb = 109 | c = 1
      if(sliding_window.includes(sb + c)) { // 109 includes 1091 x
        sb += c;
        continue;
      } else {
        let match_index : number = sliding_window.indexOf(sb); // 0
        let match_length : number = sb.length; // 3
        
        let pre_compressed_output : string = ""
        
        if(match_index != -1 && match_length > 0) { // there is a match, and there are contents in it, so compressed_output = [0, 3]
          pre_compressed_output = `[${match_index.toString(16)},${match_length.toString(16)}]`;
        } else {
          pre_compressed_output = sb; // this becomes 109
        }
        
        if(sb.length < pre_compressed_output.length) {
          pre_compressed_output = sb;
        }
        
        compressed_output += pre_compressed_output;
        
        sliding_window += sb; // this becomes 109109
        sb = c; // this becomes 1
        continue;
      }
		}
    
    // final run through
    
    let match_index : number = sliding_window.indexOf(sb); // 0
    let match_length : number = sb.length; // 3
    
    let pre_compressed_output : string = ""
    
    if(match_index != -1 && match_length > 0) { // there is a match, and there are contents in it, so compressed_output = [0, 3]
      pre_compressed_output = `[${match_index.toString(16)},${match_length.toString(16)}]`;
    } else {
      pre_compressed_output = sb; // this becomes 109
    }
    
    if(sb.length < pre_compressed_output.length) {
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
	public static DECOMPRESS(s : string) : string {
		let sliding_window : string = ""; // define the sliding window
		
		let decompressed_output : string = ""; // store the compressed output
		
		let sb : string = ""; // stringbuffer for decoding bracket sets
		
		let nodejs_string : string = Buffer.from(s, 'base64').toString(); // specific wrapper for nodejs
		
    let character_count : number = 0;
    
		for(const c of nodejs_string) {      
      // if the sliding window gets too big then slide it
			while(sliding_window.length > DEFLATE2.MAX_WINDOW_SIZE) {
				sliding_window = sliding_window.substring(1, sliding_window.length);
			}
      
      if(c == '[' || sb != "") {
        sb += c;
      }
      
      if(sb == "") {
        character_count++;
        decompressed_output += c;
        sliding_window += c;
      }
      
      if(c == ']') {
        let split_coordinates : string[] = sb.split(',');
        
        let coordinate_position : number = parseInt(split_coordinates[0].substring(1, split_coordinates[0].length), 16);
        let coordinate_length : number = parseInt(split_coordinates[1].substring(0, split_coordinates[1].length - 1), 16);
        
        let sliding_window_pull = sliding_window.substring(coordinate_position, coordinate_position + coordinate_length);
        
        if(sliding_window_pull.length != coordinate_length) {
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