module.exports = (grunt) ->

  grunt.registerTask('gui', 'Launch a GUI web interface', () ->
    @async()
    peonWebSocket = require "../lib/peon-web-socket"
    new peonWebSocket().startWorker()

  )

