

var fileInp = document.getElementById("fileInp"),
	namespaceInp = document.getElementById("namespaceInp"),
	xInp = document.getElementById("xInp"),
	yInp = document.getElementById("yInp"),
	zInp = document.getElementById("zInp"),
	tellrawLengthInp = document.getElementById("tellrawLengthInp"),
	convertButton = document.getElementById("convertButton"),
	runButton = document.getElementById("runButton"),
	runOutputElem = document.getElementById("runOutputElem"),
	genListNumInp = document.getElementById("genListNumInp"),
	provideTellrawInp = document.getElementById("provideTellrawInp"),
	provideBookInp = document.getElementById("provideBookInp"),
	tellrawOptionsElem = document.getElementById("tellrawOptionsElem"),
	tellrawSelectorInp = document.getElementById("tellrawSelectorInp"),
	bookOptionsElem = document.getElementById("bookOptionsElem"),
	bookSelectorInp = document.getElementById("bookSelectorInp"),
	bookTitleInp = document.getElementById("bookTitleInp"),
	bookAuthorInp = document.getElementById("bookAuthorInp"),
	exportedMessage = document.getElementById("exportedMessage"),
	exportedList = document.getElementById("exportedList"),
	generateFromInp = document.getElementById("generateFromInp");

var outputIndexObjective = "rgmc_output_i",
	choiceIndexObjective = "rgmc_choice_i",
	choiceTag = listName => `rgmc_${listName}_chosen`,
	newEntityTag = "rgmc_new_entity";

var fileName, fileNameMinusExtension, fileText, generator,
	armorStandCoords, namespace, tellrawLength,
	genListNum,
	provideTellraw, provideBook,
	tellrawSelector,
	bookSelector, bookTitle, bookAuthor;


fileInp.addEventListener("change", () => {
	var r = new FileReader();
	r.onload = () => {
		fileName = fileInp.files[0].name;
		fileNameMinusExtension = fileName.substring(0, (fileName.lastIndexOf(".") + 1 || fileName.length + 1) - 1)
		fileText = r.result;
		namespaceInp.value = "rgmc_" + fileNameMinusExtension;
		generator = parser.parse(fileText);
		tellrawLengthInp.value = getTellrawLength();
		
		generateFromInp.innerHTML = "";
		generator.forEach(({name}) => {
			var option = document.createElement("option");
			option.value = name;
			option.textContent = name;
			generateFromInp.insertAdjacentElement("afterbegin", option);
		});
		generateFromInp.value = generator[generator.length - 1].name;
	}
	r.readAsText(fileInp.files[0]);
});


provideTellrawInp.addEventListener("change", () => {
	if (provideTellrawInp.checked) {
		tellrawOptionsElem.classList.remove("hidden");
	} else {
		tellrawOptionsElem.classList.add("hidden");
	}
});

provideBookInp.addEventListener("change", () => {
	if (provideBookInp.checked) {
		bookOptionsElem.classList.remove("hidden");
	} else {
		bookOptionsElem.classList.add("hidden");
	}
});

genListNumInp.addEventListener("change", () => tellrawLengthInp.value = getTellrawLength());


convertButton.addEventListener("click", () => {
	armorStandCoords = [xInp.value, yInp.value, zInp.value];
	namespace = namespaceInp.value;
	tellrawLength = tellrawLengthInp.value;
	genListNum = genListNumInp.value;
	provideTellraw = provideTellrawInp.checked;
	provideBook = provideBookInp.checked;
	tellrawSelector = tellrawSelectorInp.value;
	bookSelector = bookSelectorInp.value;
	bookTitle = bookTitleInp.value;
	bookAuthor = bookAuthorInp.value;
	saveFunctions(convertGenerator(generator));
});

runButton.addEventListener("click", () => {
	runOutputElem.textContent = generateFrom(generateFromInp.value);
});


function generateFrom(listName) {
	var list = getList(listName),
		item = list.items[Math.floor(Math.random() * list.items.length)];
	
	return item.map(piece => typeof piece === "string" ? piece : generateFrom(piece.list)).join("");
}

function getList(name) {
	for (let list of generator) {
		if (list.name === name) return list;
	}
	throw `can't find list ${JSON.stringify(name)}`;
}


function saveFunctions(functions) {
	var zip = new JSZip();
	addFunctionsToZip(functions, zip);
	zip.generateAsync({type: "blob"}).then(blob => {
		var a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = fileNameMinusExtension + ".zip";
		a.dispatchEvent(new MouseEvent("click"));
		exportedList.textContent = getExportedList();
		exportedMessage.classList.remove("hidden");
	});
}

function getExportedList() {
	var names = [];
	generator.slice(generator.length - genListNum).forEach(({name}) => {
		if (provideTellraw) names.push(`${namespace}:${name}/tellraw`);
		if (provideBook) names.push(`${namespace}:${name}/give`);
	});
	if (names.length === 1) return names[0];
	else if (names.length === 2) return names.join(" and ");
	else {
		names.push("and " + names.pop());
		return names.join(", ");
	}
}

function addFunctionsToZip(functions, zip, path = namespace) {
	functions.forEach(item => {
		if (item.type === "function") {
			zip.file(path + "/" + item.name + ".mcfunction", item.content.join("\n"));
		} else if (item.type === "folder") {
			addFunctionsToZip(item.content, zip, path + "/" + item.name);
		}
	});
}

function testFunctions() {
	return [{
		type: "function",
		name: "run",
		content: [
			...initCode(),
			...addItemToOutput("stuff "),
			...addItemToOutput("bluh asd"),
			...addItemToOutput("1234"),
			tellraw()
		]
	}];
}

function getTellrawLength() {
	return Math.max(...generator.slice(generator.length - genListNumInp.value).map(list => listLength(list, [])));
}

function listLength(list, visitedLists) {
	if (visitedLists.includes(list)) throw `recursion of ${JSON.stringify(list.name)} detected`;
	else {
		visitedLists = [...visitedLists, list];
		return Math.max(...list.items.map(item => listItemLength(item, visitedLists)));
	}
}

function listItemLength(item, visitedLists) {
	var result = 0;
	item.forEach(piece => {
		if (typeof piece === "string") result += 1;
		else result += listLength(getList(piece.list), visitedLists);
	});
	return result;
}

function convertGenerator(generator) {
	var provideLists = generator.slice(generator.length - genListNum);
	return generator.map(list => {
			var result = {
				type: "folder",
				name: list.name,
				content: [
					{
						type: "function",
						name: "random",
						content: listGenerateFunction(list)
					},
					...list.items.map((item, i) => ({
						type: "function",
						name: i.toString(),
						content: listItemFunction(item)
					}))
				]
			}
			if (provideLists.includes(list)) {
				if (provideTellraw) {
					result.content.push({
						type: "function",
						name: "tellraw",
						content: runCode(list.name, "tellraw")
					});
				}
				if (provideBook) {
					result.content.push({
						type: "function",
						name: "give",
						content: runCode(list.name, "book")
					});
				}
			}
			return result;
		});
}

function runCode(mainList, type) {
	return [
		...initCode(),
		`function ${namespace}:${mainList}/random`,
		type === "tellraw" ? tellraw() : book()
	];
}

function tellraw() {
	return `tellraw ${tellrawSelector} ${textJson()}`;
}

function book() {
	return `give ${bookSelector} written_book 1 0 {title:${JSON.stringify(bookTitle)},author:${JSON.stringify(bookAuthor)},pages:[${JSON.stringify(textJson())}]}`;
}

function textJson() {
	var result;
	for (let i = 0; i < tellrawLength; i++) {
		let front = `{"selector":"@e[score_${outputIndexObjective}=${i},score_${outputIndexObjective}_min=${i}]"`;
		if (i) result = front + `,"extra":[` + result + "]}";
		else result = front + "}";
	}
	return result;
}

function initCode() {
	return [
		`kill @e[score_${outputIndexObjective}_min=0]`,
		`scoreboard objectives remove ${outputIndexObjective}`,
		`scoreboard objectives remove ${choiceIndexObjective}`,
		`scoreboard objectives add ${outputIndexObjective} dummy`,
		`scoreboard objectives add ${choiceIndexObjective} dummy`
	];
}

function listGenerateFunction(list) {
	var result = [
		`kill @e[score_${choiceIndexObjective}_min=0]`
	];
	list.items.forEach((item, i) => {
		result.push(...newArmorStand({[choiceIndexObjective]: i}));
	});
	result.push(
		`scoreboard players tag @r[type=armor_stand,score_${choiceIndexObjective}_min=0] add ${choiceTag(list.name)}`,
		...list.items.map((item, i) => {
			return `function ${namespace}:${list.name}/${i} if @e[score_${choiceIndexObjective}=${i},score_${choiceIndexObjective}_min=${i},tag=${choiceTag(list.name)}]`;
		})
	);
	return result;
}

function listItemFunction(listItem) {
	var result = [];
	listItem.forEach((piece, i) => {
		if (typeof piece === "string") result.push(...addItemToOutput(piece));
		else result.push(`function ${namespace}:${piece.list}/random`);
	});
	return result;
}

function addItemToOutput(item) {
	return [
		`scoreboard players add @e[score_${outputIndexObjective}_min=0] ${outputIndexObjective} 1`,
		...newArmorStand({[outputIndexObjective]: 0}, item)
	];
}

function newArmorStand(scores, name) {
	var result = [
		`summon armor_stand ${armorStandCoords.join(" ")} {Tags: [${JSON.stringify(newEntityTag)}],${name ? ` CustomName: ${JSON.stringify(name)},` : ""} NoGravity: 1, Invisible: 1}`
	];
	for (let objective in scores) {
		result.push(`scoreboard players set @e[tag=${newEntityTag}] ${objective} ${scores[objective]}`);
	}
	result.push(`scoreboard players tag @e[tag=${newEntityTag}] remove ${newEntityTag}`);
	return result;
}

