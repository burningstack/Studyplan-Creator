class Plan {
	constructor(name, sem, maxEctsPerSem, mods) {
		if (typeof name === "string" && !isNaN(sem) && !isNaN(maxEctsPerSem)) {
			this.name = name;
			this.sem = sem;
			this.maxEctsPerSem = maxEctsPerSem;
			//plan is an array with all Modules
			this.mods = mods;
		}
		else {
			throw new Error("fehlerhafte Parameter");
		}
	}

	print() {
		console.log("%s, %d, %d", this.name, this.sem, this.maxEctsPerSem);
	}

	setName(value) {
		if (value.length !== 0) {
			this.name = value;
		}
	}

	setMods(mods) {
		this.mods = mods;
	}

	getName() { return this.name; }
	getSem() { return this.sem; }
	getMaxModPerSem() { return this.maxEctsPerSem; }
	getMods() { return this.mods; }
}
module.exports = Plan;
