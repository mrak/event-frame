'use strict';
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(global)
  } else if (typeof root.define === 'function' && root.define.amd) {
    root.define([], function () { return factory(root) })
  } else {
    root.EventFrame = factory(root)
  }
})(this, function (root) {
  /** @module: event-frame */
  var pragma = '/*event-frame*/'

  function addEventListener (element, event, fn, capture) {
    if (element.addEventListener) {
      element.addEventListener(event, fn, Boolean(capture))
    } else {
      element.attachEvent('on' + event, fn)
    }
  }

  function removeEventListener (element, event, fn, capture) {
    if (element.removeEventListener) {
      element.removeEventListener(event, fn, Boolean(capture))
    } else {
      element.removeEvent('on' + event, fn)
    }
  }

  function uuid () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0
      var v = c === 'x' ? r : r & 0x3 | 0x8

      return v.toString(16)
    })
  }

  /**
   * @name EventFrame
   * @class
   * @classdesc
   * `EventFrame` serves as an event-emitter between the current page and another iframe or window.
   * @description
   * The constructor for `EventFrame` instances. It requires a reference to the frame or window that you want to connect with.
   * @example
   * var eventFrame = new EventFrame({
   *   frame: document.querySelector('iframe#my-iframe-id'),
   *   origin: 'https://example.com'
   * });
   * @param {object} options
   * All constructor options are specified in this object
   * @param {HTMLIFrameElement|Window} options.frame
   * The `iframe`, popup, or `Window` to create a connection with.
   * @param {string=} options.origin
   * Restrict events to an exact origin. An origin consists of the protocol, host, and port. Defaults to `*` which applies to any origin.
   */
  var exports = function (options) {
    var self = this
    var listeners = {}
    var callbacks = {}
    var origin = options.origin || '*'
    var frame = options.frame

    if (frame == null) {
      throw new Error('options.frame is required.')
    }
    if (frame instanceof root.HTMLIFrameElement) {
      frame = frame.contentWindow
    }
    if (typeof frame.postMessage !== 'function') {
      throw new Error('options.frame does not support postMessage.')
    }

    function onmessage (e) {
      var data

      if (e.source !== frame) { return }
      if (origin !== '*' && e.origin !== origin) { return }
      if (e.data.substr(0, pragma.length) !== pragma) { return }

      try {
        data = JSON.parse(e.data.substr(pragma.length))
      } catch (_) { return }

      if (data.event) {
        onevent(e, data)
      } else if (data.reply) {
        onreply(data)
      }
    }

    function onevent (e, data) {
      var i, callback

      if (!listeners[data.event]) { return }

      if (data.callback) {
        callback = function () {
          var reply = {
            reply: data.callback,
            args: Array.prototype.slice.call(arguments)
          }

          reply = pragma + JSON.stringify(reply)
          e.source.postMessage(reply, e.origin)
        }
        data.args.push(callback)
      }

      for (i = 0; i < listeners[data.event].length; i++) {
        listeners[data.event][i].apply(null, data.args)
      }
    }

    function onreply (data) {
      callbacks[data.reply].apply(null, data.args)
      delete callbacks[data.reply]
    }

    /**
     * @function
     * @memberof EventFrame
     * @instance
     * @description
     * Begin listening for incoming events from the given frame.
     * Normally you will not need to execute this method, as the constructor
     * calls it implicitly
     * @param {Window} win The browser window on which to listen to incoming `message` events.
     * @returns {EventFrame}
     */
    function start (win) {
      addEventListener(win || root, 'message', onmessage)
      return self
    }

    /**
     * @function
     * @memberof EventFrame
     * @instance
     * @description
     * Stop listening for incoming events from the given frame.
     * This is good for "teardown" purposes.
     * @param {Window} win The browser window on which to stop listening to incoming `message` events.
     * @returns {EventFrame}
     */
    function stop (win) {
      removeEventListener(win || root, 'message', onmessage)
      return self
    }

    /**
     * @function
     * @memberof EventFrame
     * @instance
     * @example
     * eventFrame.on('myEventName', function () {
     *   console.log('recieved the following arguments:', arguments);
     * });
     * @example
     * // With a callback
     * eventFrame.on('myEventName', function (data, callback) {
     *   console.log('recieved the following data:', data);
     *   callback('Thank you very much for your data');
     * });
     * @description Register a `listener` to handle an incoming `event`.
     * @param {string} event The name of the event to add a listener for.
     * @param {function} listener The function to handle the incoming event.
     * @returns {EventFrame}
     */
    function on (event, listener) {
      listeners[event] = listeners[event] || []
      listeners[event].push(listener)
      return self
    }

    /**
     * @function
     * @memberof EventFrame
     * @instance
     * @example
     * var event = 'myEventname'
     * var listener = function () {
     *   console.log('recieved the following arguments:', arguments);
     * }
     * eventFrame.on(event, listener);
     * eventFrame.off(event, listener);
     * @description Unregister a `listener` that handles an incoming `event`.
     * @param {string} event The name of the event to remove a listener from.
     * @param {function} listener The function that handles the incoming event.
     * @returns {EventFrame}
     */
    function off (event, listener) {
      var i
      var eventListeners = listeners[event]

      if (!eventListeners) { return self }

      for (i = 0; i < eventListeners.length; i++) {
        if (eventListeners[i] === listener) {
          eventListeners.splice(i, 1)
          return self
        }
      }
    }

    /**
     * @function
     * @memberof EventFrame
     * @instance
     * @example
     * // Emit an event with no arguments
     * eventFrame.emit('just letting you know');
     * @example
     * // Emit an event with some data
     * eventFrame.emit('My name is', name);
     * @example
     * // Emit an event with a callback
     * eventFrame.emit('What did you have for dinner?', function (item) {
     *   console.log('They had', item, 'for dinner');
     * });
     * @example
     * // Emit an event with data and a callback
     * eventFrame.emit('Here is my key. Can I have yours?', myFakeKey, function (theirKey) {
     *   console.log('Muahah, my key was fake. Here is theirs:', theirKey);
     * });
     * @description emit an `event`, optionally with data.
     * @param {string} event The name of the event to emit.
     * @param {...*=} argument Zero or more arguments to pass along with the event.
     * @param {function=} callback
     * A callback that can be invoked from the listener on the receiving side of the event.
     * The callback must be the last parameter given.
     * @returns {EventFrame}
     */
    function emit (event) {
      var id, message
      var data = {
        event: event,
        args: Array.prototype.slice.call(arguments, 1)
      }
      var callback = data.args[data.args.length - 1]

      if (typeof callback === 'function') {
        id = uuid()
        callbacks[id] = callback
        data.callback = id
        data.args.pop()
      }

      message = pragma + JSON.stringify(data)
      frame.postMessage(message, origin)
      return self
    }

    this.start = start
    this.stop = stop
    this.on = on
    this.off = off
    this.emit = emit

    start()
  }

  return exports
})
