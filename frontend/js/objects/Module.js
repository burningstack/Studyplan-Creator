class Module {
	constructor(name, ects) {
		if (typeof name === "string" && !isNaN(ects)) {
			this.name = name;
			this.ects = ects;
		}
		else {
			throw new Error("fehlerhafte Parameter");
		}
	}

	print() {
		console.log("%s, %d", this.name, this.ects);
	}

	setName(value) {
		if (value.length !== 0) {
			this.name = value;
		}
	}

	getName() { return this.name; }
	getECTS() { return this.ects; }
}
module.exports = Module;
