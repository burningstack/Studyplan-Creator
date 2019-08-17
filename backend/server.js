const express = require("express");
const path = require("path");
const Module = require("./objects/Module.js");
const Plan = require("./objects/Plan.js");
const PersistManager = require("./manager/PersistenceManager.js");
var bodyParser = require("body-parser");
var exports = module.exports = {};

//globale variablen
var modules = new Array();
var plans = new Array();
var minECTS;
var firstStart = true;

exports.setModules = function (mods) {
	modules = mods;
};

exports.setPlans = function (pl) {
	plans = pl;
};

exports.setMinECTS = function (ects) {
	minECTS = ects;
};

exports.setFirstStart = function (first) {
	firstStart = first;
};

//server init
var port = process.argv[2];
let server = express();
server.use(express.static(path.join(__dirname, "../dist")));
server.use(bodyParser.json()); // support json encoded bodies
server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//GET First Start
server.get("/firstStart", function (req, res) {
	PersistManager.loadGlobalVars();
	res.json(firstStart);
});

//GET min ECTS
server.get("/minECTS", function (req, res) {
	PersistManager.loadGlobalVars();
	res.json(minECTS);
});

//POST Min ECTS
server.post("/postMinECTS", function (req) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	minECTS = content.minECTS;
	//Sobald gesetzt ist der "erste Start" vorbei
	firstStart = false;
	PersistManager.saveSettings(minECTS, firstStart);
});

//GET Modules
server.get("/modules", function (req, res) {
	PersistManager.loadGlobalVars();
	res.json(modules);
});

//POST Module
server.post("/postModule", function (req, res) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	var module = new Module(content.name, content.ects);
	modules.push(module);
	PersistManager.saveModules(modules);
	res.json(modules);
});

//GET Plans
server.get("/plans", function (req, res) {
	PersistManager.loadGlobalVars();
	res.json(plans);
});

//POST Plan
server.post("/postPlan", function (req, res) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	var modArray = new Array();
	if (content.mods !== undefined) {
		for (var i = 0; i < content.mods.length; i++) {
			var modulTmp = new Module(content.mods[i].name, content.mods[i].ects);
			modArray.push(modulTmp);
		}
	}
	else {
		var maxkleinsteModule = content.sem * (content.maxEctsPerSem / minECTS);
		for (i = 0; i < maxkleinsteModule; i++) {
			modulTmp = new Module("Wahlpflichtfach", minECTS);
			modArray.push(modulTmp);
		}
	}
	var plan = new Plan(content.name, content.sem, content.maxEctsPerSem, modArray);
	//if includes --> replace
	var replaced = false;
	for (i = 0; i < plans.length; i++) {
		if (plans[i].getName() === plan.getName()) {
			plans[i] = plan;
			replaced = true;
			break;
		}
	}
	if (!replaced) { //falls er noch nicht dabei war
		plans.push(plan);
	}
	PersistManager.savePlans(plans);
	res.json(plans);
});

//POST changeModuleName
server.post("/changeModuleName", function (req, res) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	var oldName = content.old;
	var newName = content.new;
	for (var i = 0; i < modules.length; i++) {
		if (modules[i].getName() === oldName) {
			modules[i].setName(newName);
			break;
		}
	}
	PersistManager.saveModules(modules);

	for (i = 0; i < plans.length; i++) {
		var currentPlan = plans[i];
		for (var j = 0; j < currentPlan.getMods().length; j++) {
			var currentModule = currentPlan.getMods()[j];
			if (currentModule.name === oldName) {
				currentModule.name = newName;
			}
		}
	}
	PersistManager.savePlans(plans);
	var toSend = new Array(2);
	toSend[0] = plans;
	toSend[1] = modules;
	res.json(toSend);
});

//POST changePlanName
server.post("/changePlanName", function (req, res) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	var oldName = content.old;
	var newName = content.new;

	for (var i = 0; i < plans.length; i++) {
		if (plans[i].getName() === oldName) {
			plans[i].setName(newName);
			break;
		}
	}
	PersistManager.savePlans(plans);
	res.json(plans);
});

//POST deleteModule
server.post("/delModule", function (req, res) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	var toDelete = content.del;

	for (var i = 0; i < modules.length; i++) {
		if (modules[i].getName() === toDelete) {
			modules.splice(i, 1);
			break;
		}
	}
	PersistManager.saveModules(modules);
	for (i = 0; i < plans.length; i++) {
		var currentPlan = plans[i];
		for (var j = 0; j < currentPlan.getMods().length; j++) {
			var currentModule = currentPlan.getMods()[j];
			if (currentModule.name === toDelete) {
				currentModule.name = "Wahlpflichtfach";
				var toAddModules = currentModule.ects / minECTS;
				for (var m = 0; m < toAddModules; m++) {
					currentPlan.getMods().splice(j, 0, new Module("Wahlpflichtfach", minECTS));
				}
				currentModule.ects = minECTS;
			}
		}
	}
	var toSend = new Array(2);
	toSend[0] = plans;
	toSend[1] = modules;
	res.json(toSend);
});

//POST deletePlan
server.post("/delPlan", function (req, res) {
	PersistManager.loadGlobalVars();
	var content = req.body;
	var toDelete = content.del;
	console.log("toDelete: " + toDelete);
	for (var i = 0; i < plans.length; i++) {
		if (plans[i].getName() === toDelete) {
			plans.splice(i, 1);
			break;
		}
	}
	PersistManager.savePlans(plans);
	res.json(plans);
});

//Site not available
server.get("*", function (req, res) {
	res.status(404).json("Page not found");
});

//load settings
PersistManager.loadGlobalVars();

//server start
server.listen(port);
console.log("run server on port:" + port);
