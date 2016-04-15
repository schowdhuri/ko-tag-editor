;(function () {
    "use strict";
    var template = "<div class='tag-editor'>";
    template += "    <input type='text' data-bind='textInput: tagName,";
    template += "                                  hasFocus: inputHasFocus,";
    template += "                                  event: { keydown: onKeyDown },";
    template += "                                  attr: {placeholder: placeholder }' />";
    template += "    <!-- ko if: allowAdd && isNewTag() -->";
    template += "    <div class='new-tag' data-bind='text: newTagName, click: onTagAdd'></div>";
    template += "    <!-- /ko -->";
    template += "    <ul class='options-dropdown'";
    template += "        data-bind='visible: showAvailableOptions,";
    template += "                    foreach: availableOptions'>";
    template += "        <li data-bind='click: $component.onTagSelect,";
    template += "                       event: { mouseover: $component.onOptionHover.bind(this, $index()) },";
    template += "                       text: text,";
    template += "                       css:{ highlighted: $component.highlighted()==$index()}'></li>";
    template += "    </ul>";
    template += "    <div class='selected-tags' data-bind='foreach: selectedOptions'>";
    template += "        <div class='tag'>";
    template += "            <span data-bind='text: text'></span>";
    template += "            <button type='button' data-bind='click: $component.onTagRemove'>&times;</button>";
    template += "        </div>";
    template += "    </div>";
    template += "</div>";

    function ViewModel(params) {
        var that = this;
        // --------------------------------
        // Observables
        // --------------------------------
        this.options = (params && typeof(params.items)==="function" ? params.items :
                        (params && params.items ? ko.observableArray(params.items) : ko.observableArray([])));
        this.tagName = ko.observable();
        this.inputHasFocus = ko.observable(false);
        this.dropdownOpen = ko.observable(false);
        this.highlighted = ko.observable(-1);
        this.preSelectedItems = (params && typeof(params.preSelectedItems)==="function" ? params.preSelectedItems :
                        (params && params.preSelectedItems ? ko.observableArray(params.preSelectedItems) : ko.observableArray([])));

        this.allowAdd = params && typeof(params.allowAdd)!=="undefined" ? !!params.allowAdd : true;
        this.placeholder = params && params.placeholder || "";
        // --------------------------------
        // Computed
        // --------------------------------
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
            return !that.isNewTag() && that.dropdownOpen() && that.availableOptions().length;
        });
        // --------------------------------
        // Event handlers
        // --------------------------------
        this.onKeyDown = function(date, ev) {
            var highlighted = that.highlighted();
            var availableOptions = that.availableOptions();
            switch(ev.keyCode) {
                case 40: // DOWN ARROW
                    if(highlighted<availableOptions.length-1)
                        that.highlighted(highlighted+1);
                    return false;
                case 38: // UP ARROW
                    if(highlighted>0)
                        that.highlighted(highlighted-1);
                    return false;
                case 13: // ENTER/RETURN
                    if(that.allowAdd && that.isNewTag()) {
                        // add
                        that.onTagAdd();
                    } else if(highlighted>-1 && highlighted<availableOptions.length) {
                        // select
                        that.onTagSelect(that.availableOptions()[highlighted]);
                    }
                    return false;
                case 27: //ESC
                    that.tagName("");
                    this.inputHasFocus(false);
                    that.dropdownOpen(false);
            };
            return true;
        };
        this.onOptionHover = function(index, ev) {
            that.highlighted(index);
            return true;
        };
        this.onTagAdd = function() {
            var p;
            var item = {
                text : that.tagName(),
                value : that.tagName()
            };
            if(typeof(params.onBeforeAdd)==="function") {
                p = params.onBeforeAdd(item);
            } else {
                p = Promise.resolve(item);
            }
            p.then(function(newitem) {
                newitem._isSelected = true;
                that.options.push(newitem);
                if(typeof(params.onAdd)==="function") {
                    p = params.onAdd(newitem);
                }
            });
            that.tagName("");
            this.inputHasFocus(false);
            return true;
        };
        this.onTagRemove = function(opt) {
            var p;
            if(typeof(params.onBeforeDelete)==="function") {
                p = params.onBeforeDelete(opt);
            } else {
                p = Promise.resolve();
            }
            p.then(function() {
                opt._isSelected = false;
                that.updateOption(opt);
            });
            return true;
        };
        this.onTagSelect = function(opt) {
            var p;
            if(typeof(params.onBeforeSelect)==="function") {
                p = params.onBeforeSelect(opt);
            } else {
                p = Promise.resolve();
            }
            p.then(function() {
                opt._isSelected = true;
                that.updateOption(opt);
            });
            return true;
        };
        // --------------------------------
        // Utilities
        // --------------------------------
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
        // --------------------------------
        // Subscriptions
        // --------------------------------
        this.inputHasFocus.subscribe(function(val) {
            if(val) {
                that.dropdownOpen(true);
            } else {
                setTimeout(function() {
                    that.dropdownOpen(false);
                }, 150);
            }
        });
        this.showAvailableOptions.subscribe(function(val) {
            if(val)
                that.highlighted(-1);
        });
        this.preSelectedItems.subscribe(function() {
            var items = that.preSelectedItems();
            items.forEach(function(item) {
                var optionIndex = that.findOption(item);
                var option;
                if(optionIndex<0){
                    return;
                }
                option = that.options()[optionIndex];
                Object.assign(option, item); // allow adding new attrs
                option._isSelected = true;
                that.updateOption(option);
            });
        });
        // --------------------------------
        // Cleanup
        // --------------------------------
        this.dispose = function() {
            that.options(null);
        };
    };
    // --------------------------------
    // Init
    // --------------------------------
    ko.components.register("tag-editor", {
        viewModel : ViewModel,
        template : template
    });
})();
