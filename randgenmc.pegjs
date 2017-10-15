

{
	
	function genstring(h, t) {
		var result = [...h];
		t.forEach(piece => piece.forEach(piece => result.push(...piece)));
		var collapsed = [];
		result.forEach(piece => {
			if (typeof piece === "string" && typeof collapsed[collapsed.length - 1] === "string") {
				collapsed[collapsed.length - 1] += piece;
			} else collapsed.push(piece);
		});
		return collapsed;
	}
	
}


generator = lists:(_ l:list {return l})+ _ {return lists}

list = "$" name:genstring items:(linebreak gs:genstring? {return gs || []})+ {
	while (!items[items.length - 1].length) items.pop();
	return {name: name.join(""), items}
}

genstring = !"$" h:genstringitem+ t:(linew genstringitem+)* {return genstring(h, t)}

genstringitem = ![\[\]\\ \t\r\n] i:. {return i}
			  / escape
			  / genex

genex = "[" list:genstring "]" {return {type: "genex", list: list.join("")}}

escape = "\\" c:. {return c}

linew = [ \t]+

linebreak = "\n" / "\r" "\n"?

_ = [ \t\r\n]*