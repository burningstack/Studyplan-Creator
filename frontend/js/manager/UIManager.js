//The UIManager handles all actions which get triggered by the user.
const Module = require("../objects/Module.js");
const Plan = require("../objects/Plan.js");
const Utils = require("../utils/Utils.js");
const FileExporter = require("../utils/FileExporter.js");

// provides study-plans and all the modules globaly
var minECTS;
var isFirstApplicationStart = true;
var gloPlans = null;
var gloModules = null;
var highlightedCells = new Array();
var waitForInteraction = false;
var localnetworkManager;
var zwischenSpeicherTabelle;
var currentShowedPlanID;
var currentHighligtedPlan;
var interactionSemaphore = false;
// table colors
var tdHighLiteColor = "#FF0000";
var tdColorStandard = "#96dce9";

class UIManager {
	constructor(networkManager) {
		this.zwischenSpeicherTabelle = undefined;
		this.networkManager = networkManager;
		localnetworkManager = this.networkManager;
	}
	buildUI(firstStart) {
		isFirstApplicationStart = firstStart;
		if (isFirstApplicationStart) {
			drawEnterUiForMinECTS(document.getElementById("currentplan"));
			drawModulesList(null);
			drawPlansList(null);
		}
		else {
			drawModulesList(null);
			drawPlansList(null);
			document.getElementById("addModule").onclick = onClickAddModule;
			document.getElementById("addPlan").onclick = onClickAddPlan;
			//set all new saved values
			localnetworkManager.getModules(); // --> to trigger createRigthList() with current data
			localnetworkManager.getPlans(); // --> to trigger createLeftList() with current data
			localnetworkManager.getMinECTS();
		}
	}
	setMinECTS(minAtr) {
		minECTS = minAtr;
	}

	drawPlansList(planes) {
		drawPlansList(planes);
	}

	drawModulesList(modules) {
		drawModulesList(modules);
	}
}
module.exports = UIManager;

// All the following Methods which are needed to create UI
// 1. drawEnterUiForMinECTS() --> createss Input Field to enter minECTS (only at the first start of application)
// 2. drawPlan() --> draws a studyplan
// 3. drawPlansList() --> shows all available studyplans
// 4. drawModulesList() --> shows all available modules
// 5. drawEnterUiForModule() --> draws a formular to create a module
// 6. drawEnterUiForPlan() --> draws a formular to create a plan

function drawEnterUiForMinECTS(root) {
	var div = document.createElement("div");
	div.setAttribute("class", "minECTSEnterUI");
	div.setAttribute("id", "minECTSEnterUi");
	var p = document.createElement("p");
	p.innerHTML = "minECTS pro Modul: ";
	var input = document.createElement("input");
	input.setAttribute("id", "tmpminECTS");
	div.appendChild(p);
	div.appendChild(input);
	var button = document.createElement("button");
	button.setAttribute("id", "postMinEcts");
	button.innerHTML = "ok";
	button.onclick = triggerPostminECTS;
	div.appendChild(button);
	root.appendChild(div);
}

function drawPlan(planID) {
	var toDrawPlan = getPlanDataByID(planID);
	if (toDrawPlan === -1) {
		return;
	}
	removeCurrentShowedPlan();
	var rootDiv = document.getElementById("currentplan");
	// LEFT
	var semesterTableDiv = document.createElement("div");
	var semesterTable = document.createElement("table");
	semesterTableDiv.setAttribute("display", "block");
	semesterTableDiv.setAttribute("float", "left");
	semesterTableDiv.setAttribute("id", "semNumberDiv");

	for (var ii = 0; ii < toDrawPlan.getSem(); ii++) {
		var semTR = document.createElement("tr");
		var semTD = document.createElement("td");
		semTD.innerHTML = toDrawPlan.getSem() - ii;
		semTR.appendChild(semTD);
		semesterTable.appendChild(semTR);
	}
	semesterTableDiv.appendChild(semesterTable);
	var semesterTableDiv2 = document.createElement("div");
	var pEcts = document.createElement("p");
	pEcts.innerHTML = "Sem.";
	semesterTableDiv2.append(pEcts);
	document.getElementById("numberOfSem").appendChild(semesterTableDiv2);
	document.getElementById("numberOfSem").appendChild(semesterTableDiv);

	var headPlusTable = document.createElement("div");
	headPlusTable.setAttribute("display", "block");
	headPlusTable.setAttribute("float", "right");
	//HEAD
	var planHeader = document.createElement("div");
	var tableName = document.createElement("p");
	tableName.innerHTML = planID;
	var buttonPNGExport = document.createElement("button");
	var buttonSVGExport = document.createElement("button");
	var buttonPrint = document.createElement("button");
	buttonPNGExport.innerHTML = "EXPORT PNG";
	buttonPNGExport.addEventListener("click", () => {
		FileExporter.savePNG(table);
	});
	buttonSVGExport.innerHTML = "EXPORT SVG";
	buttonSVGExport.addEventListener("click", () => {
		FileExporter.saveSVG(table);
	});
	buttonPrint.innerHTML = "Print";
	buttonPrint.addEventListener("click", () => {
		window.print();
	});
	planHeader.appendChild(tableName);
	planHeader.appendChild(buttonPNGExport);
	planHeader.appendChild(buttonSVGExport);
	planHeader.appendChild(buttonPrint);
	headPlusTable.appendChild(planHeader);

	//Main
	var highlitedStudienablaufplanListElement = document.getElementById(planID);
	if (highlitedStudienablaufplanListElement !== null) {
		highlitedStudienablaufplanListElement.style.background = tdColorStandard;
	}
	currentHighligtedPlan = document.getElementById(planID);
	currentShowedPlanID = planID;
	var mods = toDrawPlan.getMods();
	var table = document.createElement("table");
	table.setAttribute("class", "a");
	table.setAttribute("id", "tablePrintID");
	var counter = 0;
	var abbruchKriteriumRows = toDrawPlan.getSem(); //Anzahl Semester
	var abbruchKriertumCells = toDrawPlan.getMaxModPerSem() / minECTS; //Module / Sem
	for (var i = 0, k = 0; i < abbruchKriteriumRows; i++) {
		var tr = document.createElement("tr");
		for (var j = 0; j < abbruchKriertumCells; k++) {
			var currentModule = mods[counter++];
			j += (currentModule.getECTS() / minECTS);
			var name = currentModule.getName() + " (" + currentModule.getECTS() + "p)";
			var cell = createCell(k, (currentModule.getECTS() / minECTS), name);
			tr.appendChild(cell);
		}
		table.appendChild(tr);
	}
	headPlusTable.appendChild(table);
	rootDiv.appendChild(headPlusTable);
}

function drawPlansList(plansAtr, page) {
	if (plansAtr !== null && plansAtr !== undefined) {
		gloPlans = plansAtr;
	}
	if (page === undefined || page === null) {
		page = 1;
	}
	var root = document.getElementById("leftMenu");
	var cchilds = root.childNodes;
	for (var i = 0; i < cchilds.length; i++) {
		cchilds[i].remove();
	}

	var ul = document.createElement("ul");
	ul.setAttribute("id", "planList");
	var li1 = document.createElement("li");
	li1.setAttribute("class", "active");
	li1.innerHTML = "Studienablaufpläne";
	var li2 = document.createElement("li");
	li2.setAttribute("id", "addPlan");
	if (!isFirstApplicationStart) {
		li2.onclick = onClickAddPlan;
	}
	var li2img = document.createElement("img");
	li2img.setAttribute("src", "add-icon.png");
	li2.appendChild(li2img);
	ul.appendChild(li1);
	ul.appendChild(li2);
	root.appendChild(ul);

	//page
	if (plansAtr !== null && plansAtr !== undefined) {
		var spaceForList = window.innerHeight - document.getElementById("header").offsetHeight - document.getElementById("footer").offsetHeight - 16;
		var maxItems = Math.floor((spaceForList - (li1.offsetHeight + li2.offsetHeight)) / li1.offsetHeight) - 2;

		var paginationNeeded = plansAtr.length >= (maxItems + 1);
		if (paginationNeeded) {
			//pack plansAtr in different pages
			var anzahlArrays = Math.ceil(plansAtr.length / maxItems);
			var arraysArray = new Array(anzahlArrays);
			var currentArrayIndex = 0; //page
			var currentArray = new Array();
			for (i = 0; i < plansAtr.length; i++) {
				currentArray.push(plansAtr[i]);
				if (currentArray.length === maxItems) {
					arraysArray[currentArrayIndex++] = currentArray;
					currentArray = new Array();
				}
			}
			arraysArray[currentArrayIndex] = currentArray;

			var toShowArray = arraysArray[page - 1];
			for (i = 0; i < toShowArray.length; i++) {
				addPlanInPlanList(toShowArray[i]);
			}

			//adds navigation
			var navigator = document.createElement("li");
			var butLeft = document.createElement("button");
			butLeft.setAttribute("class", "leftArrow");
			butLeft.setAttribute("id", "pagButPlaLe");
			butLeft.addEventListener("click", () => {
				var newPage = page - 1;
				if (newPage >= 1) {
					drawPlansList(plansAtr, newPage);
				}
			});
			var butRight = document.createElement("button");
			butRight.addEventListener("click", () => {
				var newPage = page + 1;
				if (newPage <= arraysArray.length) {
					drawPlansList(plansAtr, newPage);
				}
			});
			butRight.setAttribute("class", "rightArrow");
			butRight.setAttribute("id", "pagButPlaRe");
			var pageCounter = document.createElement("p");
			pageCounter.setAttribute("id", "pagCouPlan");
			pageCounter.innerHTML = page + "/" + arraysArray.length;

			navigator.appendChild(butLeft);
			navigator.appendChild(pageCounter);
			navigator.appendChild(butRight);

			ul.appendChild(navigator);
		}
		else {
			for (i = 0; i < gloPlans.length; i++) {
				addPlanInPlanList(gloPlans[i]);
			}
		}
	}
	drawPlan(currentShowedPlanID);
}

function drawModulesList(modules, page) {
	if (modules !== null && modules !== undefined) {
		gloModules = modules;
	}
	if (page === undefined || page === null) {
		page = 1;
	}
	var root = document.getElementById("rightMenu");
	var cchilds = root.childNodes;
	for (var i = 0; i < cchilds.length; i++) {
		cchilds[i].remove();
	}

	var ul = document.createElement("ul");
	ul.setAttribute("id", "moduleList");
	var li1 = document.createElement("li");
	li1.setAttribute("class", "active");
	li1.innerHTML = "Module";
	var li2 = document.createElement("li");
	li2.setAttribute("id", "addModule");
	if (!isFirstApplicationStart) {
		li2.onclick = onClickAddModule;
	}
	var li2img = document.createElement("img");
	li2img.setAttribute("src", "add-icon.png");
	li2.appendChild(li2img);
	ul.appendChild(li1);
	ul.appendChild(li2);
	root.appendChild(ul);

	if (modules !== null && modules !== undefined) {
		var spaceForList = window.innerHeight - document.getElementById("header").offsetHeight - document.getElementById("footer").offsetHeight - 16;
		var maxItems = Math.floor((spaceForList - (li1.offsetHeight + li2.offsetHeight)) / li1.offsetHeight) - 3;

		var paginationNeeded = modules.length >= (maxItems + 1);
		if (paginationNeeded) {
			//pack modules in different pages
			var anzahlArrays = Math.ceil(modules.length / maxItems);
			var arraysArray = new Array(anzahlArrays);
			var currentArrayIndex = 0; //page
			var currentArray = new Array();
			for (i = 0; i < modules.length; i++) {
				currentArray.push(modules[i]);
				if (currentArray.length === maxItems) {
					arraysArray[currentArrayIndex++] = currentArray;
					currentArray = new Array();
				}
			}
			arraysArray[currentArrayIndex] = currentArray;

			var toShowArray = arraysArray[page - 1];
			for (i = 0; i < toShowArray.length; i++) {
				addModuleInModuleList(toShowArray[i]);
			}

			//adds navigation

			var navigator = document.createElement("li");
			var butLeft = document.createElement("button");
			butLeft.setAttribute("class", "leftArrow");
			butLeft.setAttribute("id", "pagButModLe");
			butLeft.addEventListener("click", () => {
				var newPage = page - 1;
				if (newPage >= 1) {
					drawModulesList(modules, newPage);
				}
			});
			var butRight = document.createElement("button");
			butRight.addEventListener("click", () => {
				var newPage = page + 1;
				if (newPage <= arraysArray.length) {
					drawModulesList(modules, newPage);
				}
			});
			butRight.setAttribute("class", "rightArrow");
			butRight.setAttribute("id", "pagButModRi");
			var pageCounter = document.createElement("p");
			pageCounter.innerHTML = page + "/" + arraysArray.length;
			pageCounter.setAttribute("id", "pagCouMod");

			navigator.appendChild(butLeft);
			navigator.appendChild(pageCounter);
			navigator.appendChild(butRight);

			ul.appendChild(navigator);
		}
		else {
			for (i = 0; i < modules.length; i++) {
				addModuleInModuleList(modules[i]);
			}
		}
	}
}

function drawEnterUiForModule(root) {
	var div = document.createElement("div");
	div.setAttribute("class", "moduleEnterUI");
	div.setAttribute("id", "ModulEnterUi");
	var p = document.createElement("p");
	p.innerHTML = "Modulname : ";
	var input = document.createElement("input");
	input.setAttribute("id", "tmpModuleName");
	div.appendChild(p);
	div.appendChild(input);

	p = document.createElement("p");
	p.innerHTML = " ECTS: ";
	div.appendChild(p);
	var radioForm = document.createElement("form");
	radioForm.setAttribute("id", "radioForm");

	var max = 0;
	for (var i = 0; i < gloPlans.length; i++) {
		if (gloPlans[i].getMaxModPerSem() > max) {
			max = gloPlans[i].getMaxModPerSem();
		}
	}

	if (max === 0) {
		max = 6 * minECTS;
	}

	for (i = 1; i <= max / minECTS; i++) {
		var radioButton = document.createElement("input");
		var value = (i * minECTS);
		radioButton.setAttribute("class", "container");
		radioButton.setAttribute("type", "radio");
		radioButton.setAttribute("name", "moduleECTS");
		radioButton.setAttribute("id", value);
		radioButton.setAttribute("value", value);
		radioButton.innerHTML = value;
		radioForm.appendChild(radioButton);
		var label = document.createElement("label");
		label.setAttribute("for", value);
		label.innerHTML = value;
		radioForm.appendChild(label);
	}
	div.appendChild(radioForm);
	var button = document.createElement("button");
	button.setAttribute("id", "tmpButtonAdd");
	button.onclick = triggerPostModule;
	button.innerHTML = "Hinzufügen";
	div.appendChild(button);
	button = document.createElement("button");
	button.innerHTML = "Abbrechen";
	button.setAttribute("id", "tmpButtonCancel");
	button.addEventListener("click", () => {
		removeCurrentShowedPlan();
		interactionSemaphore = false;
		currentShowedPlanID = -1;
		disHighlightCurrentHighlightedPlan();
	});
	div.appendChild(button);
	root.appendChild(div);
}

function drawEnterUiForPlan(root) {
	var div = document.createElement("div");
	div.setAttribute("class", "planEnterUI");
	div.setAttribute("id", "PlanEnterUi");

	var p = document.createElement("p");
	p.innerHTML = "Plan : ";
	var input = document.createElement("input");
	input.setAttribute("id", "tmpPlanName");
	div.appendChild(p);
	div.appendChild(input);

	p = document.createElement("p");
	p.innerHTML = " Anzahl Semester: ";
	input = document.createElement("input");
	input.setAttribute("id", "tmpPlanAnzahlSem");
	div.appendChild(p);
	div.appendChild(input);

	p = document.createElement("p");
	p.innerHTML = " max ECTS / Sem: ";
	div.appendChild(p);
	var radioForm = document.createElement("form");
	radioForm.setAttribute("id", "radioForm");

	for (var i = 1; i <= 10; i++) {
		var radioButton = document.createElement("input");
		var value = (i * minECTS);
		radioButton.setAttribute("class", "container");
		radioButton.setAttribute("type", "radio");
		radioButton.setAttribute("name", "moduleECTS");
		radioButton.setAttribute("id", value);
		radioButton.setAttribute("value", value);
		radioButton.innerHTML = value;
		radioForm.appendChild(radioButton);
		var label = document.createElement("label");
		label.setAttribute("for", value);
		label.innerHTML = value;
		radioForm.appendChild(label);
	}
	div.appendChild(radioForm);

	var button = document.createElement("button");
	button.innerHTML = "Hinzufügen";
	button.setAttribute("id", "tmpButtonAdd");
	button.onclick = triggerPostPlan;
	div.appendChild(button);
	button = document.createElement("button");
	button.innerHTML = "Abbrechen";
	button.setAttribute("id", "tmpButtonCancel");
	button.addEventListener("click", () => {
		removeCurrentShowedPlan();
		interactionSemaphore = false;
		currentShowedPlanID = -1;
		disHighlightCurrentHighlightedPlan();
	});
	div.appendChild(button);
	root.appendChild(div);
}

// OnClick-Methods and EventListener
// 1. windowEventListener 	--> 	gets triggered if user sizes the browser window
// 2. onClickAddPlan()		--> 	draws formular to add new plan
// 3. onClickAddModule()	--> 	draws formular to add new module
// 4. onClickPlan()			--> 	triggers the plan editmode
// 5. onClickModule()		--> 	triggers the module editmode
// 6. onClickTableCell()	--> 	selects table cell

window.addEventListener("resize", () => {
	resetBlockingBooleansForCellClick();
	drawPlansList(gloPlans, 1);
	drawModulesList(gloModules, 1);
});

function onClickAddPlan() {
	// Semaphore to block interaction
	if (interactionSemaphore) {
		return;
	}
	if (!waitForInteraction) {
		disHighlightCurrentHighlightedPlan();
		interactionSemaphore = true;
		resetHighlitedCells();
		var mainDiv = document.getElementById("currentplan");
		removeCurrentShowedPlan();
		drawEnterUiForPlan(mainDiv);
	}
}

function onClickAddModule() {
	if (interactionSemaphore) {
		return;
	}
	if (!waitForInteraction) {
		disHighlightCurrentHighlightedPlan();
		interactionSemaphore = true;
		resetHighlitedCells();
		var mainDiv = document.getElementById("currentplan");
		removeCurrentShowedPlan();
		//Here Ui for Add new Module
		drawEnterUiForModule(mainDiv);
	}
}

function onClickPlan(e) {
	if (interactionSemaphore) {
		return;
	}
	e = e || window.event;
	e = e.target || e.srcElement;
	var targetPlan = document.getElementById(e.id);
	disHighlightCurrentHighlightedPlan();
	targetPlan.style.background = tdColorStandard;
	currentHighligtedPlan = targetPlan;
	if (e.id === currentShowedPlanID) {
		interactionSemaphore = true;
		targetPlan.onclick = null;
		var oldText = targetPlan.innerHTML;
		var editText = document.createElement("input");
		editText.value = oldText;
		editText.setAttribute("display", "inline-block");
		editText.setAttribute("id", "tmpEditPlan");
		targetPlan.innerHTML = "";
		targetPlan.appendChild(editText);
		var but = document.createElement("button");
		but.setAttribute("display", "inline-block");
		but.setAttribute("id", "tmpEditPlanOK");
		but.innerHTML = "ok";
		but.onclick = function click() {
			var newText = editText.value;
			if (doesPlanAllreadyExists(editText.value) && oldText !== editText.value) {
				alert("Dieser Plan existiert bereits !");
				return;
			}
			localnetworkManager.postPlanNameUpdate(oldText, newText);
			interactionSemaphore = false;
		};
		targetPlan.appendChild(but);
		but = document.createElement("button");
		but.setAttribute("display", "inline-block");
		but.setAttribute("id", "tmpEditPlanDel");
		but.innerHTML = "del";
		but.onclick = function click() {
			localnetworkManager.deletePlan(oldText);
			removeCurrentShowedPlan();
			interactionSemaphore = false;
			currentShowedPlanID = -1;
		};
		targetPlan.appendChild(but);
		return;
	}
	resetBlockingBooleansForCellClick();
	drawPlan(targetPlan.id);
}

function onClickModule(e) {
	if (interactionSemaphore) {
		return;
	}
	e = e || window.event;
	e = e.target || e.srcElement;
	var targetModule = document.getElementById(e.id);
	if (targetModule !== null) {
		if (waitForInteraction) {
			//if module already exists in study plan
			if (Utils.getModuleNameOutOfString(targetModule.innerHTML) !== "Wahlpflichtfach") {
				var currentplan;
				for (var kkk = 0; kkk < gloPlans.length; kkk++) {
					if (gloPlans[kkk].getName() === currentShowedPlanID) {
						currentplan = gloPlans[kkk];
					}
				}
				for (kkk = 0; kkk < currentplan.getMods().length; kkk++) {
					if (currentplan.getMods()[kkk].getName() === Utils.getModuleNameOutOfString(targetModule.innerHTML)) {
						alert("Modul existiert bereits im Studienablaufplan !");
						return;
					}
				}
			}

			var mergeOrSplit = 0;

			if (highlightedCells.length === 1 && highlightedCells[0].colSpan > 1 && (Utils.getModulePointsOutOfString(targetModule.innerHTML) < Utils.getModulePointsOutOfString(highlightedCells[0].innerHTML))) {
				mergeOrSplit = 1;
			}

			var pointsFromHighlighted = 0;
			for (var tmp = 0; tmp < highlightedCells.length; tmp++) {
				pointsFromHighlighted += (highlightedCells[tmp].colSpan * minECTS);
			}
			if (Utils.getModulePointsOutOfString(targetModule.innerHTML) > pointsFromHighlighted) {
				alert("Das ausgewählte Modul (" + Utils.getModulePointsOutOfString(targetModule.innerHTML) + ") ist größer als der makierte Bereich (" + pointsFromHighlighted + ")");
				return;
			}
			if (Utils.getModulePointsOutOfString(targetModule.innerHTML) < pointsFromHighlighted) {
				mergeOrSplit = 1;
			}
			if (Utils.getModulePointsOutOfString(targetModule.innerHTML) < pointsFromHighlighted && highlightedCells.length > 1) {
				alert("Das ausgewählte Modul (" + Utils.getModulePointsOutOfString(targetModule.innerHTML) + ") ist kleiner als der makierte Bereich (" + pointsFromHighlighted + ")");
				return;
			}
			//=============================================================================================
			var numberOfselectedCells = 0;
			var parentRow = highlightedCells[0].parentNode;
			var currentRowCells = parentRow.childNodes;
			var futureRowCells = new Array();
			if (mergeOrSplit === 0) {
				numberOfselectedCells = Utils.getNumberOfColspan(highlightedCells);

				highlightedCells = Utils.sortCellArrayByID(highlightedCells);
				var newBiggerCell = createCell(highlightedCells[0].id, numberOfselectedCells, targetModule.innerHTML);
				futureRowCells.push(newBiggerCell);
				for (var ii = 0; ii < currentRowCells.length; ii++) {
					var iiCell = currentRowCells[ii];
					if (!(Utils.isCellinArray(iiCell, highlightedCells))) {
						futureRowCells.push(currentRowCells[ii]);
					}
				}
				futureRowCells = Utils.sortCellArrayByID(futureRowCells);
				for (ii = 0; ii < currentRowCells.length; ii++) {
					currentRowCells[ii--].remove();
				}
				for (ii = 0; ii < futureRowCells.length; ii++) {
					parentRow.appendChild(futureRowCells[ii]);
				}
			}
			else if (mergeOrSplit === 1) {
				numberOfselectedCells = Utils.getModulePointsOutOfString(targetModule.innerHTML) / minECTS;
				var newSmallerCell = createCell(highlightedCells[0].id, numberOfselectedCells, targetModule.innerHTML);
				futureRowCells.push(newSmallerCell);
				for (var iii = 0; iii < currentRowCells.length; iii++) {
					var iiiCell = currentRowCells[ii];
					if (!(Utils.isCellinArray(iiiCell, highlightedCells))) {
						futureRowCells.push(currentRowCells[iii]);
					}
				}
				var numberOfToAddCells = (highlightedCells[0].colSpan - numberOfselectedCells);
				for (var i = 1; i <= numberOfToAddCells; i++) {
					var newIndex = parseInt(highlightedCells[0].id) + i;
					var newCell = createCell(newIndex, 1, "Wahlpflichtfach (" + minECTS + "p)");
					for (var j = 0; j < futureRowCells.length; j++) {
						if (newCell.id === futureRowCells[j].id) {
							newCell = createCell(++newIndex, 1, "Wahlplichtfach (" + minECTS + "p)");
							j--;
						}
					}
					futureRowCells.push(newCell);
				}
				futureRowCells = Utils.sortCellArrayByID(futureRowCells);
				for (ii = 0; ii < currentRowCells.length; ii++) {
					currentRowCells[ii--].remove();
				}
				for (ii = 0; ii < futureRowCells.length; ii++) {
					parentRow.appendChild(futureRowCells[ii]);
				}
			}
			var table = document.getElementById("currentplan").childNodes[0].childNodes[1];
			var mods = tableToMods(table);
			var plan = getPlanDataByID(currentShowedPlanID);
			plan.setMods(mods);
			localnetworkManager.postPlan(plan);

			resetBlockingBooleansForCellClick();
		}
		else {
			if (Utils.getModuleNameOutOfString(targetModule.innerHTML) === "Wahlpflichtfach") {
				return;
			}
			interactionSemaphore = true;
			disHighlightCurrentHighlightedPlan();
			targetModule.onclick = null;
			var nameBevor = Utils.getModuleNameOutOfString(targetModule.innerHTML);
			var points = Utils.getModulePointsOutOfString(targetModule.innerHTML);
			var oldText = targetModule.innerHTML;
			var editText = document.createElement("input");
			editText.value = Utils.getModuleNameOutOfString(targetModule.innerHTML);
			editText.setAttribute("display", "inline-block");
			editText.setAttribute("id", "tmpEditModu");
			targetModule.innerHTML = "";
			targetModule.appendChild(editText);
			var p = document.createElement("p");
			p.innerHTML = "(" + points + "p)";
			p.setAttribute("display", "inline-block");
			targetModule.appendChild(p);
			var but = document.createElement("button");
			but.setAttribute("display", "inline-block");
			but.setAttribute("id", "tmpEditModuOK");
			but.innerHTML = "ok";
			but.onclick = function click() {
				if (editText.value === "") {
					return;
				}
				if (doesModuleAllreadyExists(editText.value) && nameBevor !== editText.value) {
					alert("Dieses Modul existiert bereits !");
					return;
				}
				var newText = editText.value + " (" + points + "p)";
				targetModule.innerHTML = newText;
				interactionSemaphore = false;
				localnetworkManager.postModuleNameUpdate(Utils.getModuleNameOutOfString(oldText), Utils.getModuleNameOutOfString(newText));
			};
			targetModule.appendChild(but);
			but = document.createElement("button");
			but.setAttribute("display", "inline-block");
			but.setAttribute("id", "tmpEditModuDel");
			but.innerHTML = "del";
			but.onclick = function click() {
				localnetworkManager.deleteModule(Utils.getModuleNameOutOfString(oldText));
				reDrawCurrentShowedPlan();
				interactionSemaphore = false;
			};
			targetModule.appendChild(but);
		}
	}
}

function onClickTableCell(e) {
	if (interactionSemaphore) {
		return;
	}
	e = e || window.event;
	e = e.target || e.srcElement;
	var currentElement = document.getElementById(e.id);
	if (highlightedCells.includes(currentElement)) {
		if (Utils.isOuterBoundCell(highlightedCells, currentElement)) {
			currentElement.style.background = tdColorStandard;
			var index = highlightedCells.indexOf(currentElement);
			if (index > -1) {
				highlightedCells.splice(index, 1);
			}
			if (highlightedCells.length === 0) {
				waitForInteraction = false;
			}
			return;
		}
		else {
			return;
		}
	}
	if (highlightedCells.length !== 0) {
		if (!Utils.isNeighbor(highlightedCells, currentElement)) {
			return;
		}
	}
	waitForInteraction = true;
	currentElement.style.background = tdHighLiteColor;
	highlightedCells.push(currentElement);
}

// Help/Support functions

function triggerPostminECTS() {
	var moduleUIDiv = document.getElementById("minECTSEnterUi");
	minECTS = document.getElementById("tmpminECTS").value;
	if (minECTS < 1) {
		alert("Der minimale ECTS Umfang eines Moduls muss größer 0 sein !");
		return;
	}
	localnetworkManager.postMinECTS(minECTS);
	moduleUIDiv.remove();
	localnetworkManager.postModule(new Module("Wahlpflichtfach", minECTS));
	isFirstApplicationStart = false;
	document.getElementById("addModule").onclick = onClickAddModule;
	document.getElementById("addPlan").onclick = onClickAddPlan;
	localnetworkManager.getModules(); // --> to trigger createRigthList() with current data
	localnetworkManager.getPlans(); // --> to trigger createLeftList() with current data
}

function triggerPostModule() {
	var root = document.getElementById("currentplan");
	var moduleUIDiv = document.getElementById("ModulEnterUi");

	var name = document.getElementById("tmpModuleName").value;
	if (Utils.checkName(name)) {
		return;
	}
	if (doesModuleAllreadyExists(name)) {
		alert("Ihre Eingabe existiert bereits !");
		return;
	}
	var ects = 0;
	var radios = document.getElementById("radioForm").childNodes;
	for (var i = 0; i < radios.length; i += 2) {
		if (radios[i].checked) {
			ects = parseInt(radios[i + 1].innerHTML);
		}
	}
	if (ects === 0) {
		alert("Bitte die Anzahl der ECTS-Punkte für dieses Modul angeben ! ");
		return;
	}
	var module = new Module(name, ects);
	localnetworkManager.postModule(module);
	moduleUIDiv.remove();
	if (zwischenSpeicherTabelle !== undefined) {
		root.appendChild(zwischenSpeicherTabelle);
		zwischenSpeicherTabelle = undefined;
	}
	interactionSemaphore = false;
	drawPlan(getPlanDataByID(currentShowedPlanID));
	currentShowedPlanID = -1;
}

function triggerPostPlan() {
	var root = document.getElementById("currentplan");
	var planUIDiv = document.getElementById("PlanEnterUi");
	var name = document.getElementById("tmpPlanName").value;
	if (Utils.checkName(name)) {
		return;
	}
	if (doesPlanAllreadyExists(name)) {
		alert("Ihre Eingabe existiert bereits !");
		return;
	}
	var maxEctsPerSem = 0;
	var radios = document.getElementById("radioForm").childNodes;
	for (var i = 0; i < radios.length; i += 2) {
		if (radios[i].checked) {
			maxEctsPerSem = parseInt(radios[i + 1].innerHTML);
		}
	}
	if (maxEctsPerSem === 0) {
		alert("Bitte die Anzahl der maximal möglichen ECTS-Punkte pro Semester auswählen ! ");
		return;
	}

	var anazhlSem = parseInt(document.getElementById("tmpPlanAnzahlSem").value);
	if (anazhlSem <= 0) {
		alert("Anzahl Semester muss größer 0 sein !");
		return;
	}
	var plan = new Plan(name, anazhlSem, maxEctsPerSem, undefined);

	localnetworkManager.postPlan(plan);

	planUIDiv.remove();
	if (zwischenSpeicherTabelle !== undefined) {
		root.appendChild(zwischenSpeicherTabelle);
		zwischenSpeicherTabelle = undefined;
	}
	interactionSemaphore = false;
}

function addModuleInModuleList(module) {
	var li = document.createElement("li");
	li.innerHTML = module.getName() + " (" + module.getECTS() + "p)";
	//listener
	li.onclick = onClickModule;
	li.setAttribute("id", module.getName());
	document.getElementById("moduleList").appendChild(li);
}

function addPlanInPlanList(plan) {
	var li = document.createElement("li");
	li.innerHTML = plan.getName();
	//listener
	li.onclick = onClickPlan;
	li.setAttribute("id", plan.getName());
	document.getElementById("planList").appendChild(li);
}

function tableToMods(table) {
	var mods = new Array();
	for (var i = 0; i < table.childNodes.length; i++) {
		for (var j = 0; j < table.childNodes[i].childNodes.length; j++) {
			var currentCell = table.childNodes[i].childNodes[j].innerHTML;
			var name = Utils.getModuleNameOutOfString(currentCell);
			var ects = Utils.getModulePointsOutOfString(currentCell);
			var mtmp = new Module(name, ects);
			mods.push(mtmp);
		}
	}
	return mods;
}

function doesModuleAllreadyExists(name) {
	for (var i = 0; i < gloModules.length; i++) {
		if (gloModules[i].getName().toLowerCase() === name.toLowerCase()) {
			return true;
		}
	}
	return false;
}

function doesPlanAllreadyExists(name) {
	for (var i = 0; i < gloPlans.length; i++) {
		if (gloPlans[i].getName().toLowerCase() === name.toLowerCase()) {
			return true;
		}
	}
	return false;
}

function resetHighlitedCells() {
	for (var i = 0; i < highlightedCells.length; i++) {
		highlightedCells[i].background = tdColorStandard;
	}
	waitForInteraction = false;
	highlightedCells = new Array();
}

function createCell(id, cellWidth, text) {
	var td = document.createElement("td");
	td.setAttribute("colspan", cellWidth);
	td.innerHTML = text;
	td.style.background = tdColorStandard;
	td.setAttribute("id", id);
	td.onclick = onClickTableCell;
	return td;
}

function getPlanDataByID(id) {
	if (gloPlans !== null) {
		for (var i = 0; i < gloPlans.length; i++) {
			if (gloPlans[i].getName() === id) {
				return gloPlans[i];
			}
		}
	}
	return -1;
}

function removeCurrentShowedPlan() {
	var root = document.getElementById("currentplan");
	var child = root.lastElementChild;
	while (child) {
		root.removeChild(child);
		child = root.lastElementChild;
	}
	root = document.getElementById("numberOfSem");
	child = root.lastElementChild;
	while (child) {
		root.removeChild(child);
		child = root.lastElementChild;
	}
}

function reDrawCurrentShowedPlan() {
	if (currentShowedPlanID !== -1) {
		drawPlan(getPlanDataByID(currentShowedPlanID));
	}
}

function disHighlightCurrentHighlightedPlan() {
	if (currentHighligtedPlan !== undefined && currentHighligtedPlan !== null) {
		currentHighligtedPlan.style.background = "#eee";
	}
}

function resetBlockingBooleansForCellClick() {
	interactionSemaphore = false;
	waitForInteraction = false;
	highlightedCells = new Array();
}
