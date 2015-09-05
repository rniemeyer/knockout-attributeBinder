# knockout-attributeBinder

## What is this plugin?

The `knockout-attributeBinder` is a custom binding provider for Knockout that allows you to create bindings from any `data-` (by default) attributes and can map all of the existing Knockout bindings to use this syntax. 

This allows you to add bindings like:

```html
    <ul data-foreach="items">
        <li data-text="description"></li>
    </ul>
```
 
You can also choose to add your own custom handlers. For example, you could choose to make `<span data-local="user-help"></span>` result in applying a `text` binding with a localized value to the element.
 
Additionally, existing `data-bind` style bindings are still respected and can be mixed with any of the attribute bindings.

## API

### ko.attributeBinder.install(addCurrentBindings)

Make Knockout use the attribute binding provider. Optionally, choose to map handlers for all existing bindings.

### ko.attributeBinder.uninstall()

Restore Knockout's previously used binding provider.

### ko.attributeBinder.setPrefix(prefix)

Change the prefix from the default (`data`). For example, you may choose `data-ko` or `ko` as your prefix.

### ko.attributeBinder.register(name, handler)

Register a new attribute handler. The handler functions takes four arguments:

- **key** - the name of the mapping (if attribute was `data-myThing`, then this would be `myThing`). *Note: the attribute name is lower-cased during matching, but the `key` will always be provided to the handler with the original casing.*
- **value** - the string value of the attribute
- **context** - the data context associated with the node
- **node** - the node itself

As a simple example suppose that you want to use `data-local` to provide localized text and that you have an object containing the current language's keys and values in an observable called `localizedKeys`. A handler might look like:

```js
ko.attributeBinding.register("local", function(key, value) {
    return {
        text: function() {
            return localizedKeys()[value] || "Not localized";
        }
    };
});
```

The handler should return an object with any bindings and their associated accessor (a function that returns the value to bind against to capture dependencies at the right time).

### ko.attributeBinder.unregister(name)

Unregister an existing handler.

### ko.attributeBinder.addCurrentBindingHandlers()

Map all of the existing bindings to handlers. This can optionally be done as part of the `install` method.

### ko.attributeBinder.clearAllHandlers()

Clear out all of the mapped handlers.

### ko.attributeBinder.defaultExpressionHandler

A function that can be used to parse an attribute's value as an expression with context. This is used as the handler for any of the existing bindings, if you choose to have them mapped. It can also be used for any custom handlers that you add or even within a custom handler.

### ko.attributeBinder.defaulltStringHandler

A function that can be used to parse an attribute's value as a string. This allows for simpler processing and let's you do `data-something="someValue"` rather than having to wrap the value in quotes like: `data-something="'someValue'"`.

## Typical Usage

Before calling `ko.applyBindings` activate this binding provider and map all of the existing bindings by calling:

```js
ko.attributeBinder.install(true);
```

**License**: MIT [http://www.opensource.org/licenses/mit-license.php](http://www.opensource.org/licenses/mit-license.php)
