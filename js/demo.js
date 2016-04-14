;(function() {
	"use strict";
	var tagsViewModel = {
		items1 : [
			{ text : "Indian Rupee", value : "INR" },
			{ text : "US Dollar", value : "USD" }
		],
		items2 : [
			{ text : "Chinese Yuan", value : "CNY" },
			{ text : "Thai Baht", value : "THB" }
		],
		confirmDelete : function(opt) {
			return new Promise(function(fulfill, reject) {
				if(confirm("Are you sure you want to remove " + JSON.stringify(opt) + "?"))
					fulfill();
				else
					reject();
			});
		}
	};
	ko.applyBindings(tagsViewModel, document.querySelector(".container"));
})();
