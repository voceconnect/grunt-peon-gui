module.exports = (grunt) ->
  grunt.registerTask('gui', 'Launch a GUI web interface', () ->
    @async()

    class PeonWebSocket
      spawn: require("child_process").spawn
      pkg: require(process.cwd() + '/package.json')
      workers: []
      tasks: grunt.task._tasks
      projectPort: 61750
      server: require('http').createServer((request, response) ->
        response.writeHead(404)
        response.end()
      )

      constructor: () ->
        process.on("uncaughtException", @killWorkers)
        process.on("SIGINT", @killWorkers)
        process.on("SIGTERM", @killWorkers)
        @addConfigToTasks()

      addConfigToTasks : () ->
        config = grunt.config.get()
        that = @
        grunt.util._.forEach(@tasks, (task, k)->
          taskConfig = JSON.stringify(config[k], null, 4) || "No configuration"
          that.tasks[k].config = taskConfig
        )

      killWorkers: () ->
        @workers.forEach((worker) ->
          process.kill(worker)
        )
        process.exit()

      startWorker: ()->
        ps = require('portscanner')
        pPort = @projectPort
        nPort = @projectPort + 4
        that = @
        ps.findAPortNotInUse(pPort, nPort, 'localhost', (err, port) ->
          @projectPort = port
          if @projectPort
            that.server.listen(port, () ->
              grunt.log.writeln("WebSocket running on localhost:#{port}")
            )
          else
            grunt.log.writeln("Too many WebSockets open. Close one.")
        )
        @listen()

      listen: () ->
        WebSocketServer = require('websocket').server
        wsServer = new WebSocketServer(
          httpServer: @server
          autoAcceptConnections: false
        )
        that = @
        wsServer.on('request', (request) ->
          connection = request.accept('echo-protocol', request.origin)
          connection.on('message', (message) ->
            if message.type is 'utf8'
              msg = message.utf8Data
              if msg is 'connect'
                connection.sendUTF(JSON.stringify(
                  tasks: that.tasks
                  project: that.pkg.name
                  port: that.projectPort
                  action: "connected"
                ))
              else if Object.keys(that.tasks).indexOf(msg) > -1
                watcher = that.spawn('peon', [msg, '-no-color'])
                that.workers.push(watcher)
                connection.send("Running Task: #{msg}")
                watcher.stdout.on('data', (data) ->
                  if data
                    connection.send(data.toString())
                )
                watcher.stdout.on('end', (data) ->
                  if data
                    connection.send(data.toString())
                  connection.sendUTF(JSON.stringify({ action: 'done'}))
                )
                watcher.stderr.on('data', (stderr) ->
                  if stderr
                    connection.send(stderr.toString())
                )
                watcher.on('exit', (code) ->
                )
          )
          connection.on('close', () ->

          )
        )

    class PeonGUIServer
      connect: require('connect')
      path: require('path')
      server: false
      run: () ->
        portscanner = require('portscanner')
        that = @
        portscanner.checkPortStatus(8888, 'localhost', (err, status) ->
          if status is 'closed'
            appPath = that.path.resolve(__dirname, '../app')
            that.server = that.connect.createServer(that.connect.static(appPath))
            that.server.listen(8888)
          grunt.log.writeln "GUI running on localhost::8888"
        )

    new PeonGUIServer().run()
    new PeonWebSocket().startWorker()
  )

