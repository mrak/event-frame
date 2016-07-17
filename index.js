'use strict';
/** @module: event-frame */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(global)
  } else if (typeof root.define === 'function' && root.define.amd) {
    root.define([], function () { return factory(root) })
  } else {
    root.EventFrame = factory(root)
  }
})(this, function (root) {
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
  function EventFrame (options) {
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

    function start (win) {
      addEventListener(win || root, 'message', onmessage)
    }

    function stop (win) {
      removeEventListener(win || root, 'message', onmessage)
    }

    function on (event, listener) {
      listeners[event] = listeners[event] || []
      listeners[event].push(listener)
    }

    function off (event, listener) {
      var i
      var eventListeners = listeners[event]

      if (!eventListeners) { return }

      for (i = 0; i < eventListeners.length; i++) {
        if (eventListeners[i] === listener) {
          eventListeners.splice(i, 1)
          return
        }
      }
    }

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
    }

    this.start = start
    this.stop = stop
    this.on = on
    this.off = off
    this.emit = emit

    start()
  }

  return EventFrame
})
