# plugins

## Extensions

There is no simplest way to develop a plugin system for this type of application. But since we are rendering the whole page we can control the flow of extensions tagged.

### The API

When it comes to loading the extensions, the components are too frontend heavy, we might want to offload all task to the FE. The `rendering backend` will only be responsible of loading the ES module correctly.

#### Initializing a module

If you want any initial data to be specified you can use the `${ext:name}-init` syntax to load the initial data.

Example:

```json
snooze-init
{
    "servers": [
        {
            "name": "http://example.com/api/service/testing"
        },
        {
            "name": "http://example.com/api/service/production"
        }
    ]
}
```

#### Injecting a component

```js
import { Ext } from "http://ext.sych.com/esm/snooze.js"

// initializes the module
Ext.init('{ "servers": [...] }')

// params:
// name of the div
// string data for that section of docs
Ext.inject("i-21397121", '{ "name": "snooze app" }');
```

### Security

On the security part, we need to ensure that the extensions are from `ext.sych.com`. This ensures that no third-party JS files are injected inside the documentation renderer.

```toml
[extensions]
snooze = "http://ext.sych.com/esm/snooze.js
```