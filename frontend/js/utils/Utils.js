var exports = module.exports = {};

function isCellinArray(cell, array) {
	if (array.includes(cell)) {
		return true;
	}
	return false;
}
exports.isCellinArray = isCellinArray;

function getNumberOfColspan(cellArray) {
	var erg = 0;
	for (var i = 0; i < cellArray.length; i++) {
		var colspanValue = parseInt(cellArray[i].colSpan);
		erg += colspanValue;
	}
	return erg;
}
exports.getNumberOfColspan = getNumberOfColspan;

function getIndexOfElemInArray(array, elem) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] === elem) {
			return i;
		}
	}
	return -1;
}
exports.getIndexOfElemInArray = getIndexOfElemInArray;

function getModuleNameOutOfString(str) {
	var erg = "";
	for (var i = 0; i < str.length; i++) {
		var j = i + 1;
		if (str.charAt(j) === "(") {
			return erg;
		}
		erg += str.charAt(i);
	}
	return -1;
}
exports.getModuleNameOutOfString = getModuleNameOutOfString;

function getModulePointsOutOfString(str) {
	var erg = "";
	for (var i = 0; i < str.length; i++) {
		if (str.charAt(i) === "(") {
			for (var j = i + 1; j < str.length; j++) {
				if (str.charAt(j) === "p") {
					return parseInt(erg);
				}
				erg += str.charAt(j);
			}
		}
	}
	return -1;
}
exports.getModulePointsOutOfString = getModulePointsOutOfString;

function isOuterBoundCell(array, cell) {
	var tmparray = new Array(array.length);
	if (array.length > 2) {
		tmparray = sortCellArrayByID(array);
		if (cell.id === tmparray[0].id || cell.id === tmparray[tmparray.length - 1].id) {
			return true;
		}
		return false;
	}
	return true;
}
exports.isOuterBoundCell = isOuterBoundCell;

function sortCellArrayByID(array) {
	var tmp = new Array(array.length);
	for (var i = 0; i < array.length; i++) {
		tmp[i] = array[i].id;
	}
	var sortNumber = function (a, b) {
		return a - b;
	};

	tmp.sort(sortNumber);
	var newArray = new Array(array.length);
	for (i = 0; i < tmp.length; i++) {
		var elem = null;
		for (var j = 0; j < array.length; j++) {
			if (array[j].id === tmp[i]) {
				elem = array[j];
				break;
			}
		}
		newArray[i] = elem;
	}
	return newArray;
}
exports.sortCellArrayByID = sortCellArrayByID;

function isNeighbor(array, element) {
	//if left or rigth node from elem is highlited ==> neighbor
	var allCellsInRow = element.parentNode.childNodes;
	var index = getIndexOfElemInArray(allCellsInRow, element);
	var leftCell = allCellsInRow[(index - 1)];
	var rigthCell = allCellsInRow[(index + 1)];
	if (isCellinArray(leftCell, array) || isCellinArray(rigthCell, array)) {
		return true;
	}
	return false;
}
exports.isNeighbor = isNeighbor;

function isStringEmptyOrFullWithBlanks(str) {
	if (str.length === 0) {
		return true;
	}
	for (var i = 0; i < str.length; i++) {
		if (str.charAt(i) !== " ") {
			return false;
		}
	}
	return true;
}
exports.isStringEmptyOrFullWithBlanks = isStringEmptyOrFullWithBlanks;

function checkName(name) {
	if (isStringEmptyOrFullWithBlanks(name)) {
		alert("Bitte einen gültigen Namen eingeben");
		return true;
	}
	return false;
}

exports.checkName = checkName;
