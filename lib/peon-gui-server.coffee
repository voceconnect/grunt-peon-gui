###

  @modue PeonGUIServer
###
class PeonGUIServer
  grunt = require('grunt')
  connect = require('connect')
  sServer = connect.static
  path = require('path')
  server: false
  startPort = 8080
  endPort = 8088
  onPort : 0

  ###

  @constructor
  ###
  constructor: (worker) ->
    @worker = worker

  ###

  @method run
  ###
  run: () ->
    ps = require('portscanner')
    exec = require('child_process').exec
    that = @
    workerPort = @worker.getSocket()
    ps.findAPortNotInUse(startPort, endPort, 'localhost', (err, port) ->
      that.onPort = port
      appPath = path.resolve(__dirname, '../app')
      that.server = connect.createServer(sServer(appPath))
      that.server.listen(port)
      grunt.log.writeln "GUI running on localhost:#{port}"
      url = "http://localhost:#{port}/?socket=#{workerPort}"
      grunt.log.writeln "Manage this project on #{url}"
      exec("open #{url}", (err, stdout, stderr)->

      )
    )

module.exports = PeonGUIServer