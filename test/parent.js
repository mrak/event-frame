'use strict'
;(function () {
  var el = new window.EventFrame({
    frame: document.getElementById('child'),
    origin: 'http://localhost:8081'
  })

  el.on('child ready', function () {
    console.log('child reported ready')
    console.log('parent emitting "Marco"')
    el.emit('Marco', function () {
      console.log('child replied with:', arguments)
    })
  })
})()
