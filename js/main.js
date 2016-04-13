;$(function() {
	"use strict";

	function ViewModel() {
		var that = this;

		this.options = ko.observableArray([]);
		this.tagName = ko.observable();
		this.inputHasFocus = ko.observable(false);

		this.availableOptions = ko.pureComputed(function() {
			var tagName = that.tagName();
			if(typeof(tagName)==="string" && tagName.length) {
				tagName = tagName.toLowerCase();
				return that.options().filter(function(opt) {
					return !!!opt._isSelected && opt.text.toLowerCase().indexOf(tagName)>=0;
				});
			}
			return that.options().filter(function(opt) {
				return !!!opt._isSelected;
			});
		});

		this.selectedOptions = ko.pureComputed(function() {
			return that.options().filter(function(opt) {
				return !!opt._isSelected;
			});
		});

		this.newTagName = ko.pureComputed(function() {
			if(typeof(that.tagName())==="string" && that.tagName().length) {
				return "Add " + that.tagName();
			}
			return "";
		});
		this.isNewTag = ko.pureComputed(function() {
			var tagName = that.tagName();
			if(typeof(tagName)==="string" && tagName.length) {
				return that.availableOptions().length==0;
			}
			return false;
		});
		this.showAvailableOptions = ko.pureComputed(function() {
			return !that.isNewTag() && that.inputHasFocus();
		});
		
		this.onTagAdd = function() {
			that.options.push({
				text : that.tagName(),
				value : that.tagName(),
				_isSelected : true
			});
			that.tagName("");
		};
		this.onTagRemove = function(opt) {
			opt._isSelected = false;
			that.updateOption(opt);
		};
		this.onTagSelect = function(opt) {
			opt._isSelected = true;
			that.updateOption(opt);
		};
		this.findOption = function(option) {
			var index = -1;
			that.options().find(function(opt, i) {
				if(opt.value == option.value)
					index = i;
			});
			return index;
		};
		this.updateOption = function(opt) {
			var index = that.findOption(opt);
			if(typeof(index)==="undefined" || index < 0)
				return;
			that.options.splice(index, 1, opt);
		};
	};

	var vm = new ViewModel();

	vm.options([
		{ text : "Indian Rupee", value : "INR" },
		{ text : "US Dollar", value : "USD" }
	]);

	ko.applyBindings(vm, $(".tag-editor").get(0));
	window.vm = vm;
});