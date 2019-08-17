var htmlToImage = require("html-to-image");
var window = require("./FileSaver.js");

function savePNG(table) {
	htmlToImage.toBlob(table)
		.then(function (blob) {
			window.saveAs(blob, "plan.png");
		});
	console.log("Plan saved as PNG");
}

module.exports.savePNG = savePNG;

function saveSVG(table) {
	htmlToImage.toSvgDataURL(table)
		.then(function (blob) {
			window.saveAs(blob, "plan.svg");
		});
	console.log("Plan saved as SVG");
}

module.exports.saveSVG = saveSVG;

