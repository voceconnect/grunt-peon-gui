class PeonGUIServer
  grunt: require('grunt')
  connect: require('connect')
  path: require('path')
  server: false
  startPort = 8080
  endPort = 8088

  constructor: (worker) ->
    @worker = worker

  run: () ->
    ps = require('portscanner')
    that = @
    workerPort = @worker.getSocket()
    ps.findAPortNotInUse(startPort, endPort, 'localhost', (err, port) ->
      appPath = that.path.resolve(__dirname, '../app')
      that.server = that.connect.createServer(that.connect.static(appPath))
      that.server.listen(port)
      that.grunt.log.writeln "GUI running on localhost:#{port}"
      url = "http://localhost:#{port}/?socket=#{workerPort}"
      that.grunt.log.writeln "Manage this project on #{url}"
    )

module.exports = PeonGUIServer