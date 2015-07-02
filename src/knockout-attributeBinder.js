;(function(factory) {
    if (typeof define === "function" && define.amd) {
        define(["knockout"], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory(require("knockout"));
    } else {
        factory(ko);
    }
}(function(ko) {
    var existingProvider;
    var defaultProvider = new ko.bindingProvider();
    var handlers = {};
    var nameMap = {};
    var prefix = "data-";

    var extraBindings = [
        "optionsAfterRender",
        "optionsCaption",
        "optionsIncludeDestroyed",
        "optionsText",
        "optionsValue",
        "valueAllowUnset",
        "valueUpdate",
        "clickBubble" // not currently capturing other *event*Bubble bindings
    ];

    // grab all of the attributes matching the prefix from a node
    function getAttributes(node, check) {
        var index, length, attributeName, handlerName, result;

        if (node.nodeType !== 1) {
            return false;
        }

        result = {};

        for (index = 0, length = node.attributes.length; index < length; index++) {
            attributeName = node.attributes[index].name;

            if (attributeName.indexOf(prefix) === 0) {
                handlerName = nameMap[attributeName.substr(prefix.length).toLowerCase()];

                if (Object.prototype.hasOwnProperty.call(handlers, handlerName)) {
                    // if we just want to know that the node has bindings, then quit as soon as we know
                    if (check) {
                        return true;
                    }

                    result[handlerName] = node.getAttribute(attributeName);
                }
            }
        }

        return check ? false : result;
    }

    // a handler that treats the attribute's value as an expression
    function defaultExpressionHandler(key, value, context, node) {
        return defaultProvider.parseBindingsString(key + ":" + value, context, node, { valueAccessors: true });
    }

    // a handler that treats the attribute's value as an actual string
    function defaultStringHandler(key, value) {
        var result = {};
        result[key] = function() {
            return value;
        };

        return result;
    }

    // try to handle the attribute's value as an expression, but fall back to a string
    // support data-optionsText="someFunction" and data-optionsText="label" without wrapping label as a string
    function expressionOrStringHandler(key, value, context, node) {
        var result = defaultExpressionHandler(key, value, context, node);

        var expressionValue = result[key];

        // wrap to return a string, if it is not a valid expression
        result[key] = function() {
            var result;
            try {
                result = expressionValue();
            }
            catch(error) {
                result = value;
            }

            return result;
        };

        return result;
    }

    // add all of the registered binding handlers and include some of the additional bindings that aren't registered
    function addCurrentBindingHandlers() {
        ko.utils.objectForEach(ko.bindingHandlers, function(key) {
            registerHandler(key, defaultExpressionHandler);
        });

        ko.utils.arrayForEach(extraBindings, function(key) {
            registerHandler(key, expressionOrStringHandler);
        });
    }

    function registerHandler(name, handler) {
        nameMap[name.toLowerCase()] = name;
        handlers[name] = handler;
    }

    function unregisterHandler(name) {
        delete nameMap[name.toLowerCase()];
        delete handlers[name];
    }

    function clearAllHandlers() {
        nameMap = {};
        handlers = {};
    }

    // use the existing provider's logic and check for registered data- attributes
    function nodeHasBindings(node) {
        return existingProvider.nodeHasBindings(node) || getAttributes(node, true);
    }

    // get the actual bindings for a node including those by data- attributes
    function getBindingAccessors(node, context) {
        var dataAttributes;
        var result = existingProvider.getBindingAccessors(node, context);

        if (node.nodeType === 1) {
            dataAttributes = getAttributes(node);

            if (dataAttributes) {
                result = result || {};

                ko.utils.objectForEach(dataAttributes, function(key, value) {
                    ko.utils.extend(result, handlers[key](key, value, context, node));
                });
            }
        }

        return result;
    }

    // keep track of the existing provider and install the attribute binder
    function installProvider(addCurrentBindings) {
        existingProvider = ko.bindingProvider.instance;

        if (addCurrentBindings) {
            addCurrentBindingHandlers();
        }

        ko.bindingProvider.instance = {
            nodeHasBindings: nodeHasBindings,
            getBindingAccessors: getBindingAccessors
        };
    }

    function restoreOriginalProvider() {
        ko.bindingProvider.instance = existingProvider;
    }

    function setPrefix(newPrefix) {
        prefix = newPrefix + "-";
    }

    return ko.attributeBinder = {
        install: installProvider,
        uninstall: restoreOriginalProvider,
        setPrefix: setPrefix,
        register: registerHandler,
        unregister: unregisterHandler,
        defaultExpressionHandler: defaultExpressionHandler,
        defaultStringHandler: defaultStringHandler,
        addCurrentBindingHandlers: addCurrentBindingHandlers,
        clearAllHandlers: clearAllHandlers
    };
}));