EventFrame
==========

An event abstraction over browser window messaging.

`EventFrame` serves as an event-emitter between the current page and another iframe or window.

## Installation

```
> npm install event-frame
 or
> bower install event-frame
```

## Loading

### CommonJS

```javascript
var EventFrame = require('event-frame');
var bus = new EventFrame({ /* ... */ });
```

### AMD

```html
<script
  data-main="main.js"
  src="//cdnjs.cloudflare.com/ajax/libs/require.js/2.1.22/require.min.js"
></script>
```

```javascript
require(['event-frame'], function (EventFrame) {
  var bus = new EventFrame({ /* ... */ });
});
```

### Browser

```html
<script src="/path/to/event-frame.js"></script>
<script>
  var bus = new EventFrame({ /* ... */ });
</script>
```

## Api

### constructor

`new EventFrame(options: object) -> EventFrame`

The constructor for `EventFrame` instances. It requires a reference to the frame
or window that you want to connect with.

| Parameter        | Type                            | Description |
| ---------------- | ------------------------------- | ----------- |
| `options.frame`  | `Window`<br>`HTMLIFrameElement` | The `iframe`, popup, or `Window` to create a connection with.|
| `options.origin` | `string` | Restrict events to an exact origin. An origin consists of the protocol, host, and port. Defaults to `*` which applies to any origin. |

```javascript
var eventFrame = new EventFrame({
    frame: document.querySelector('iframe#my-iframe-id'),
    origin: 'https://example.com'
});
```

### start

`start() -> EventFrame`

Begin listening for incoming events. Normally you will not need to execute this method, as the constructor calls it implicitly.

Returns the `EventFrame` instance for chaining.

```javascript
eventFrame.start();
```

### stop

`stop() -> EventFrame`

Stop listening for incoming events. This is good for "teardown" purposes and
quickly deactivating all listeners.

Returns the `EventFrame` instance for chaining.

```javascript
eventFrame = new EventFrame({frame: popup});
eventFrame.stop();
// Sometime later, start listening again
eventFrame.start();
eventFrame.stop();
```

### on

`on(event: string, [listener: function]) -> EventFrame`

Register a `listener` to handle an incoming `event`.

Returns the `EventFrame` instance for chaining.

| Parameter  | Type       | Description                                  |
| ---------- | ---------- | -------------------------------------------- |
| `event`    | `string`   | The name of the event to add a listener for. |
| `listener` | `function` | The function to handle the incoming event.   |

```javascript
eventFrame.on('myEventName', function () {
  console.log('recieved the following arguments:', arguments);
});

// With a callback
eventFrame.on('myEventName', function (data, callback) {
  console.log('recieved the following data:', data);
  callback('Thank you very much for your data');
});
```

### off

`off(event: string, [listener: function]) -> EventFrame`

Unregister a `listener` that handles an incoming `event`. The `event` and
`listener` must exactly match those used with `on`.

Returns the `EventFrame` instance for chaining.

| Parameter  | Type       | Description                                      |
| ---------- | ---------- | ------------------------------------------------ |
| `event`    | `string`   | The name of the event to remove a listener from. |
| `listener` | `function` | The function that handled the incoming event.    |

```javascript
var event = 'myEventname'
var listener = function () {
  console.log('recieved the following arguments:', arguments);
}
eventFrame.on(event, listener);
eventFrame.off(event, listener);
```

### emit

`emit(event: string, [...arg: any], [callback: function])`

emit an `event`, optionally with data. May include a callback as the last parameter that a listener can invoke.

Returns the `EventFrame` instance for chaining.

| Parameter  | Type       | Description  |
| ---------- | ---------- | ---------------------------------------------------- |
| `event`    | `string`   | The name of the event to emit.                       |
| `argument` | `any`      | Zero or more arguments to pass along with the event. |
| `callback` | `function` | A callback that can be invoked from the listener on the receiving side of the event.<br>The callback must be the last parameter given. |

```javascript
// Emit an event with no arguments
eventFrame.emit('just letting you know');
// Emit an event with some data
eventFrame.emit('My name is', name);
// Emit an event with a callback
eventFrame.emit('What did you have for dinner?', function (item) {
  console.log('They had', item, 'for dinner');
});
// Emit an event with data and a callback
eventFrame.emit('Here is my key. Can I have yours?', myFakeKey, function (theirKey) {
  console.log('Muahah, my key was fake. Here is theirs:', theirKey);
});
```
