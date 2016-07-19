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
  var pragma = '/*event-frame*/'

  function _uuid () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (xy) {
      var r = Math.random() * 16 | 0
      var c = xy === 'x' ? r : r & 0x3 | 0x8
      return c.toString(16)
    })
  }

  return function EventFrame (options) {
    var self = this
    var listeners = {}
    var callbacks = {}
    var origin = options.origin || '*'
    var frame = options.frame
    var win = options._window || root

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

    function start () {
      if (win.addEventListener) {
        win.addEventListener('message', onmessage, false)
      } else {
        win.attachEvent('onmessage', onmessage)
      }
      return self
    }

    function stop () {
      if (win.removeEventListener) {
        win.removeEventListener('message', onmessage, false)
      } else {
        win.removeEvent('onmessage', onmessage)
      }
      return self
    }

    function on (event, listener) {
      listeners[event] = listeners[event] || []
      listeners[event].push(listener)
      return self
    }

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

    function emit (event) {
      var id, message
      var data = {
        event: event,
        args: Array.prototype.slice.call(arguments, 1)
      }
      var callback = data.args[data.args.length - 1]

      if (typeof callback === 'function') {
        id = _uuid()
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
})
