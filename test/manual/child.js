'use strict'
;(function () {
  var el = new window.EventFrame({
    frame: window.parent,
    origin: 'http://localhost:8080'
  })

  el.on('Marco', function (callback) {
    console.log('parent emitted "Marco"')
    console.log('child replying...')
    callback('Polo', 'just', 'kidding')
  })

  el.emit('child ready')
})()
