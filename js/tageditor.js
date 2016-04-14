;(function () {
    "use strict";
    var template = "<div class='tag-editor'>";
    template += "    <input type='text' data-bind='textInput: tagName, hasFocus: inputHasFocus, event:{ keydown: onKeyDown }' />";
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
        this.options = ko.observableArray(params && params.items || []);
        this.tagName = ko.observable();
        this.inputHasFocus = ko.observable(false);
        this.dropdownOpen = ko.observable(false);
        this.allowAdd = !!params.allowAdd || true;
        this.highlighted = ko.observable(-1);
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
                    if(that.isNewTag()) {
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
                that.options.push({
                    text : newitem.text,
                    value : newitem.value,
                    _isSelected : true
                });
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
            opt._isSelected = true;
            that.updateOption(opt);
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
        // --------------------------------
        // Cleanup
        // --------------------------------
        this.dispose = function() {
            that.options(null);
        };
    };
    // --------------------------------
    // Register
    // --------------------------------
    ko.components.register("tag-editor", {
        viewModel : ViewModel,
        template : template
    });
})();
