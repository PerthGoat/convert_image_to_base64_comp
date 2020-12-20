/// <reference path="lzss2.ts" />

// includes get-pixels node module
let getPixels = require("get-pixels");

let fs = require('fs');

// holds the image file to be processed
const IMG_FILE : string = "duck.png";
let variable_name : string = IMG_FILE.split('.')[0];

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
	for(var i = 0;i < bigData.length;i++) {
		// this chunk skips anything after the blue in RGB
		if(watchdog > 2 && watchdog < depth) {
			watchdog++;
			continue;
		}
		
		if(watchdog >= depth) {
			watchdog = 0;
		}
		
		built_string += (bigData[i] + "").padStart(3, '0'); // pad with zeros to reach 3 total digits
		
		watchdog++;
	}
	
	console.log(built_string);
	
	let compressed_string = DEFLATE2.COMPRESS(built_string); // compresses the image data
	
	compressed_string = `TextureHouse.${variable_name}="${width}_${height}_RGB:${compressed_string}"`;
	
	fs.writeFile(`${variable_name}.js`, compressed_string, (err) => {
		if(err) return console.log(err);
	});
	
	console.log(compressed_string.length / built_string.length * 100);
	console.log(pixels);
}

// gets the pixels from the image and runs processPixels
getPixels(IMG_FILE, (err, pixels) => {
	if(err) {
		console.log("BAD PATH");
		return;
	}
	
	processPixels(pixels);
});