/* globals:define */
'use strict';
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory()
  } else if (typeof window.define === 'function' && window.define.amd) {
    window.define([], factory)
  } else {
    root.EventLine = factory()
  }
})(this, function () {
  function EventLine (options) {
  }

  return EventLine
})()
