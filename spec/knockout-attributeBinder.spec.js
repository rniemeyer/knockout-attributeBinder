chai.should();

describe("knockout-attributeBinder", function() {
    var vm, content;

    function insertTestCase(html, data) {
        var container = document.createElement("div");
        container.innerHTML = html;
        content.appendChild(container);

        ko.applyBindings(data || vm, content);

        return container;
    }

    before(function() {
        ko.bindingHandlers.writeBindings = {
            init: function(element, valueAccessor, allBindings) {
                element.innerHTML = ko.toJSON(allBindings());
            }
        };
    });

    beforeEach(function() {
        content = document.createElement("div");
        document.body.appendChild(content);

        vm = {
            first: "Bob",
            last: ko.observable("Smith"),
            choices: [
                { id: 1, text: "one" },
                { id: 2, text: "two" }
            ],
            getChoiceLabel: function(item) {
                return item.text + "!";
            }
        };

        ko.attributeBinder.install(true);
    });

    afterEach(function() {
        ko.removeNode(content);
        ko.attributeBinder.uninstall();
        ko.attributeBinder.clearAllHandlers();
    });

    describe("binding", function() {
        it("should handle normal data-bind bindings", function() {
            var test = insertTestCase("<div data-bind=\"text: first\"></div>");
            test.innerHTML.should.eql("<div data-bind=\"text: first\">Bob</div>");
        });

        it("should handle default bindings by attribute name", function() {
            var test = insertTestCase("<div data-text=\"first\"></div>");
            test.innerHTML.should.eql("<div data-text=\"first\">Bob</div>");
        });

        it("should handle expressions in default bindings by attribute name", function() {
            var test = insertTestCase("<div data-text=\"first + ' ' + last()\"></div>");
            test.innerHTML.should.eql("<div data-text=\"first + ' ' + last()\">Bob Smith</div>");
        });

        it("should include extra bindings as a string value", function() {
            var test = insertTestCase("<div data-bind=\"writeBindings\" data-valueupdate=\"afterkeydown\"></div>");
            test.innerHTML.should.eql("<div data-bind=\"writeBindings\" data-valueupdate=\"afterkeydown\"\>{\"valueUpdate\":\"afterkeydown\"}</div>");
        });

        it("should handle an extra binding as a function", function() {
            var test = insertTestCase("<select data-options=\"choices\" data-optionstext=\"getChoiceLabel\"></select>");
            test.innerHTML.should.eql("<select data-options=\"choices\" data-optionstext=\"getChoiceLabel\"><option value=\"\">one!</option><option value=\"\">two!</option></select>");
        });

        it("should handle multiple bindings", function() {
            var test = insertTestCase("<div data-text=\"first\" data-visible=\"last() === 'Johnson'\"></div>");
            test.innerHTML.should.eql("<div data-text=\"first\" data-visible=\"last() === 'Johnson'\" style=\"display: none;\">Bob</div>")
        });
    });

    describe("registration", function() {
        before(function() {
            ko.attributeBinder.register("bob", function(key, value, context, node) {
                var data = [ key, value, context.$data.first, node.id ];
                return {
                    text: function() {
                        return data.join("-");
                    }
                };
            });
        });

        it("should respect a registered handler", function() {
            var test = insertTestCase("<div id=\"testing\" data-bob=\"test\"></div>");
            test.innerHTML.should.eql("<div id=\"testing\" data-bob=\"test\">bob-test-Bob-testing</div>")
        });

        it("should add all bindingHandlers when using \"addCurrentBindingHandlers\"", function() {
            // should add writeBindings to the registered list
            ko.attributeBinder.addCurrentBindingHandlers();

            var test = insertTestCase("<div data-writebindings=\"first\"></div>");
            test.innerHTML.should.eql("<div data-writebindings=\"first\">{\"writeBindings\":\"Bob\"}</div>");
        });

        it("should unregister a handler", function() {
            ko.attributeBinder.unregister("bob");

            var test = insertTestCase("<div data-bob=\"test\"></div>");
            test.innerHTML.should.eql("<div data-bob=\"test\"></div>")
        });

        it("should not add the current bindings on install, if not told to", function() {
            ko.attributeBinder.uninstall();
            ko.attributeBinder.clearAllHandlers();
            ko.attributeBinder.install();

            var test = insertTestCase("<div data-text=\"first\"></div>");
            test.innerHTML.should.eql("<div data-text=\"first\"></div>");
        });

        it("should remove all handlers with clearAllHandlers", function() {
            ko.attributeBinder.clearAllHandlers();

            var test = insertTestCase("<div data-text=\"first\"></div>");
            test.innerHTML.should.eql("<div data-text=\"first\"></div>");
        });

        it("should allow changing the prefix", function() {
            ko.attributeBinder.setPrefix("data-ko");

            var test = insertTestCase("<div data-ko-text=\"first\"></div>");
            test.innerHTML.should.eql("<div data-ko-text=\"first\">Bob</div>");
        });
    });
});