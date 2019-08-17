var fs = require("fs");
var exports = module.exports = {};
var fileModules = "persistentData/modules.json";
var filePlans = "persistentData/plans.json";
var fileSettings = "persistentData/settings.json";
var loadModules = false;
var loadPlans = false;
var loadSettings = false;

exports.saveGlobalVars = function (modules, plans, minECTS, firstStart) {
	// Build array-lists to json-string
	var saveMods = JSON.stringify(modules, null, 2);
	var savePlans = JSON.stringify(plans, null, 2);
	var tmpSettings = { minECTS: minECTS, firstStart: firstStart };
	var saveSettings = JSON.stringify(tmpSettings, null, 2);
	fs.writeFileSync(fileModules, saveMods);
	fs.writeFileSync(filePlans, savePlans);
	fs.writeFileSync(fileSettings, saveSettings);
	console.log("GlobalVars successfully saved !");
};

exports.saveModules = function (modules) {
	var saveMods = JSON.stringify(modules, null, 2);
	fs.writeFileSync(fileModules, saveMods);
	console.log("Modules successfully saved !");
};

exports.savePlans = function (plans) {
	var savePlans = JSON.stringify(plans, null, 2);
	fs.writeFileSync(filePlans, savePlans);
	console.log("Plans successfully saved !");
};

exports.saveSettings = function (minECTS, firstStart) {
	var tmpSettings = { minECTS: minECTS, firstStart: firstStart };
	var saveSettings = JSON.stringify(tmpSettings, null, 2);
	fs.writeFileSync(fileSettings, saveSettings);
	console.log("Settings successfully saved !");
};

exports.loadGlobalVars = function () {
	var i;
	const server = require("../server.js");
	const Module = require("../objects/Module.js");
	const Plan = require("../objects/Plan.js");

	// convert json into Module-obj
	if (fs.existsSync(fileModules)) {
		var jsonModules = JSON.parse(fs.readFileSync(fileModules));
		var objModules = new Array();
		for (i = 0; i < jsonModules.length; i++) {
			objModules[i] = new Module(jsonModules[i].name, jsonModules[i].ects);
		}
		// set loaded modules in server
		server.setModules(objModules);
		loadModules = true;
	}
	else {
		var objModules2 = new Array();
		server.setModules(objModules2);
		loadModules = false;
	}

	// convert json into Plan-obj
	if (fs.existsSync(filePlans)) {
		var jsonPlans = JSON.parse(fs.readFileSync(filePlans));
		var objPlans = new Array();
		for (i = 0; i < jsonPlans.length; i++) {
			objPlans[i] = new Plan(jsonPlans[i].name, jsonPlans[i].sem, jsonPlans[i].maxEctsPerSem, jsonPlans[i].mods);
		}
		// set loaded plans in server
		server.setPlans(objPlans);
		loadPlans = true;
	}
	else {
		var objPlans2 = new Array();
		server.setPlans(objPlans2);
		loadPlans = false;
	}

	if (fs.existsSync(fileSettings)) {
		var tmpSettings = JSON.parse(fs.readFileSync(fileSettings));
		// set loaded settings in server
		server.setMinECTS(tmpSettings.minECTS);
		server.setFirstStart(tmpSettings.firstStart);
		loadSettings = true;
	}
	else {
		server.setFirstStart(true);
		loadSettings = false;
	}

	if (loadModules || loadPlans || loadSettings) {
		console.log("JSON-Files successfully loaded: ");
		if (loadModules && loadPlans && loadSettings) {
			console.log("check");
		}
		else {
			if (loadModules) {
				console.log("- Modules");
			}
			if (loadPlans) {
				console.log("- Plans");
			}
			if (loadSettings) {
				console.log("- Settings");
			}
		}
	}
};
