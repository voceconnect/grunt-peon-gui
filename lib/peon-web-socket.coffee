class PeonWebSocket
  grunt = require "grunt"
  spawn = require("child_process").spawn
  pkg: require(process.cwd() + '/package.json')
  workers: []
  projectPort: 0
  server: require('http').createServer((request, response) ->
    response.writeHead(404)
    response.end()
  )

  constructor: (grunt) ->
    process.on("uncaughtException", @killWorkers)
    process.on("SIGINT", @killWorkers)
    process.on("SIGTERM", @killWorkers)
    @tasks = grunt.task._tasks
    @grunt = grunt
    @removeTasks(['gui'])
    @addConfigToTasks()
    peonFile = process.env['HOME'] + "/bin/peon/global/peon.coffee"
    if grunt.file.exists(peonFile)
      @gruntFilePath = peonFile
    else if grunt.file.exists("Gruntfile.cofee")
      @gruntFilePath = "Gruntfile.coffee"
    else if grunt.file.exists("Gruntfile.js")
      @gruntFilePath = "Gruntfile.js"
    else
      grunt.fatal("No Gruntfile found")

  addConfigToTasks: () ->
    config = @grunt.config.get()
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
    if @workers
      @workers.forEach((worker) ->
        process.kill(worker)
      )
    process.exit()

  getSocket: ()->
    @projectPort

  startWorker: ()->
    ps = require('portscanner')
    that = @
    ps.findAPortNotInUse(61750, 61755, 'localhost', (err, port) ->
      that.projectPort = port
      PeonGUIServer = require('../lib/peon-gui-server')
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
            if(that.gruntFilePath.indexOf "peon" > -1)
              args = [
                '--gruntfile'
                that.gruntFilePath
                '--base'
                '.'
                msg
              ]
            grunt.log.writeln('Running: grunt ' + args.join(" "))
            command = spawn('grunt', args)
            that.workers.push(command)
            command.stdout.on('data', (data) ->
              if data
                connection.send(data.toString())
                grunt.log.writeln(data.toString())
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

module.exports = PeonWebSocket
