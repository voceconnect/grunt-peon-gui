module.exports = (grunt) ->
  grunt.registerTask('gui', 'Launch a GUI web interface', () ->
    @async()

    class PeonWebSocket
      spawn: require("child_process").spawn
      pkg: require(process.cwd() + '/package.json')
      workers: []
      projectPort: 0
      tasks: grunt.task._tasks
      server: require('http').createServer((request, response) ->
        response.writeHead(404)
        response.end()
      )

      constructor: () ->
        process.on("uncaughtException", @killWorkers)
        process.on("SIGINT", @killWorkers)
        process.on("SIGTERM", @killWorkers)
        @removeTasks(['gui'])
        @addConfigToTasks()

      addConfigToTasks : () ->
        config = grunt.config.get()
        that = @
        grunt.util._.forEach(@tasks, (task, k)->
          taskConfig = JSON.stringify(config[k], null, 4) || "No configuration"
          that.tasks[k].config = taskConfig
        )

      removeTasks: (taskList) ->
        that = @
        grunt.util._.forEach(@tasks, (task, k)->
          if grunt.util._.indexOf(taskList, task.name) > -1
            delete that.tasks[k]
        )

      killWorkers: () ->
        @workers.forEach((worker) ->
          process.kill(worker)
        )
        process.exit()

      getSocket : ()->
        @projectPort

      startWorker: ()->
        ps = require('portscanner')
        that = @
        ps.findAPortNotInUse(61750, 61755, 'localhost', (err, port) ->
          that.projectPort = port
          new PeonGUIServer(that).run()
          if that.projectPort
            that.server.listen(port, () ->
              grunt.log.writeln("WebSocket running on localhost:#{port}")
            )
          else
            grunt.log.writeln("Too many Peon WebSockets open. Close one.")
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
                connection.send("Running Task: #{msg}")
                args = [
                  '--gruntfile'
                  '~/bin/peon/global/peon.coffee'
                  '--base'
                  '.'
                  msg
                ]
                command = that.spawn('grunt', args)
                that.workers.push(command)
                command.stdout.on('data', (data) ->
                  if data then connection.send(data.toString())
                )
                command.stdout.on('end', (data) ->
                  connection.sendUTF(JSON.stringify({ action: 'done'}))
                )
                command.stderr.on('data', (stderr) ->
                  grunt.log.writeln stderr
                  if stderr then connection.send(stderr.toString())
                )
          )
          connection.on('close', () ->

          )
        )

    class PeonGUIServer
      connect: require('connect')
      path: require('path')
      server: false

      constructor: (worker) ->
        @worker = worker

      run: () ->
        ps = require('portscanner')
        that = @
        workerPort = @worker.getSocket()
        ps.findAPortNotInUse(8080, 8088, 'localhost', (err, port) ->
          appPath = that.path.resolve(__dirname, '../app')
          grunt.file.write("#{appPath}/websocket.txt", workerPort)
          that.server = that.connect.createServer(that.connect.static(appPath))
          that.server.listen(port)
          grunt.log.writeln "GUI running on localhost::#{port}"
        )

    new PeonWebSocket().startWorker()

  )

