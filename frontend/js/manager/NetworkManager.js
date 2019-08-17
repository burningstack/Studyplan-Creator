const Module = require("../objects/Module.js");
const Plan = require("../objects/Plan.js");

var uimanager2;

class NetworkManager {
	constructor() {
		this.uimanager = undefined;
	}

	setUIManager(uiMan) {
		if (uiMan !== null || uiMan !== undefined) {
			this.uimanager = uiMan;
			uimanager2 = this.uimanager;
		}
	}
	getFirstStart() {
		fetch("http://" + window.location.host + "/firstStart")
			.then(function (res) {
				if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
					return res.json();
				}
				else {
					throw new TypeError("nothings here");
				}
			}).then(function (json) {
				var isFirstStart = json; //boolean
				uimanager2.buildUI(isFirstStart);
			});
	}

	getMinECTS() {
		fetch("http://" + window.location.host + "/minECTS")
			.then(function (res) {
				if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
					return res.json();
				}
				else {
					throw new TypeError("nothings here");
				}
			}).then(function (json) {
				uimanager2.setMinECTS(json);
			});
	}

	postMinECTS(minECTS) {
		fetch("http://" + window.location.host + "/postMinECTS", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ minECTS: minECTS })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).catch(error => {
			console.error(error.message);
		});
	}
	getModules() {
		fetch("http://" + window.location.host + "/modules")
			.then(function (res) {
				if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
					return res.json();
				}
				else {
					throw new TypeError("nothings here");
				}
			}).then(function (json) {
				__handleModulesUpdate(json);
			});
	}

	postModule(module) {
		fetch("http://" + window.location.host + "/postModule", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ name: module.getName(), ects: module.getECTS() })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).then(result => {
			__handleModulesUpdate(result);
		}).catch(error => {
			console.error(error.message);
		});
	}
	//============================================================================================================
	//============================================================================================================

	getPlans() {
		fetch("http://" + window.location.host + "/plans")
			.then(function (res) {
				if (res.status === 200 && res.headers.get("content-type").indexOf("application/json") === 0) {
					return res.json();
				}
				else {
					throw new TypeError("nothings here");
				}
			}).then(function (json) {
				//give new PlanArray to response
				__handlePlansUpdate(json);
			});
	}

	postPlan(plan) {
		fetch("http://" + window.location.host + "/postPlan", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ name: plan.getName(), sem: plan.getSem(), maxEctsPerSem: plan.getMaxModPerSem(), mods: plan.getMods() })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).then(result => {
			__handlePlansUpdate(result);
		}).catch(error => {
			console.error(error.message);
		});
	}
	postModuleNameUpdate(oldText, newText) {
		fetch("http://" + window.location.host + "/changeModuleName", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ old: oldText, new: newText })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).then(result => {
			__handlePlansUpdate(result[0]);
			__handleModulesUpdate(result[1]);
		}).catch(error => {
			console.error(error.message);
		});
	}
	postPlanNameUpdate(oldText, newText) {
		fetch("http://" + window.location.host + "/changePlanName", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ old: oldText, new: newText })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).then(result => {
			__handlePlansUpdate(result);
		}).catch(error => {
			console.error(error.message);
		});
	}
	deleteModule(moduleName) {
		fetch("http://" + window.location.host + "/delModule", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ del: moduleName })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).then(result => {
			__handlePlansUpdate(result[0]);
			__handleModulesUpdate(result[1]);
		}).catch(error => {
			console.error(error.message);
		});
	}
	deletePlan(planName) {
		fetch("http://" + window.location.host + "/delPlan", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ del: planName })
		}).then(response => {
			if (response.ok) { return response.json(); }
			else { console.log("FEHLER"); return null; }
		}).then(result => {
			__handlePlansUpdate(result);
		}).catch(error => {
			console.error(error.message);
		});
	}
}
module.exports = NetworkManager;

function __handlePlansUpdate(jsonUpdate) {
	var plans = new Array();
	for (var i = 0; i < jsonUpdate.length; i++) {
		var mods = new Array();
		for (var j = 0; j < jsonUpdate[i].mods.length; j++) {
			var name = jsonUpdate[i].mods[j].name;
			var ects = jsonUpdate[i].mods[j].ects;
			var modTMP = new Module(name, ects);
			mods.push(modTMP);
		}
		var ptmp = new Plan(jsonUpdate[i].name, jsonUpdate[i].sem, jsonUpdate[i].maxEctsPerSem, mods);
		plans.push(ptmp);
	}
	uimanager2.drawPlansList(plans);
}

function __handleModulesUpdate(jsonUpdate) {
	var modules = new Array();
	for (var i = 0; i < jsonUpdate.length; i++) {
		var mtmp = new Module(jsonUpdate[i].name, jsonUpdate[i].ects);
		modules.push(mtmp);
	}
	uimanager2.drawModulesList(modules);
}
