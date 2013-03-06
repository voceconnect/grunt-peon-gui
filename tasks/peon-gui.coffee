module.exports = (grunt) ->
  grunt.registerTask('gui', 'Launch a GUI web interface', () ->
    @async()
    WebSocketServer = require('websocket').server
    spawn = require("child_process").spawn
    http = require('http')
    portscanner = require('portscanner')
    connect = require('connect')
    path = require('path')
    pkg = require(process.cwd() + '/package.json')
    workers = []
    projectName = pkg.name
    allTasks = Object.keys(grunt.task._tasks)

    runGui = () ->
      connect.createServer(connect.static(path.resolve(__dirname, '../app'))).listen(8888)
      grunt.log.writeln "GUI running on localhost::8888"
    runGui()

    server = http.createServer((request, response) ->
      response.writeHead(404)
      response.end()
    )

    projectPort = 61750
    portscanner.findAPortNotInUse(projectPort, projectPort + 4, 'localhost',
    (error, port) ->
      if port
        server.listen(port, () ->
          grunt.log.writeln("Ready! WebSocket running on http://localhost:#{port}")
        )
      else
        grunt.log.writeln("Too many Chrome tools, please close one.")
    )

    wsServer = new WebSocketServer(
      httpServer: server
      autoAcceptConnections: false
    )

    wsServer.on('request', (request) ->
      connection = request.accept('echo-protocol', request.origin)
      connection.on('message', (message) ->
        if message.type is 'utf8'
          msg = message.utf8Data
          if msg is 'connect'
            connection.sendUTF(JSON.stringify(
              tasks: allTasks
              project: projectName
              port: projectPort
            ))
          else if allTasks.indexOf(msg) > -1
            watcher = spawn('peon', [msg, '-no-color'])
            workers.push(watcher)
            connection.send("Running Task: #{msg}")
            watcher.stdout.on('data', (data) ->
              if data
                grunt.log.writeln(data.toString())
                connection.send(data.toString())
            )
            watcher.stdout.on('end', (data) ->
              if data
                connection.send(data.toString())
              connection.sendUTF(JSON.stringify({ action: 'done'}))
            )
            watcher.stderr.on('data', (stderr) ->
              if stderr
                grunt.log.writeln(stderr.toString())
                connection.send(stderr.toString())
            )
            watcher.on('exit', (code) ->
            )
      )
      connection.on('close', () ->

      )
    )

    killWorkers = () ->
      workers.forEach((worker) ->
        process.kill(worker)
      )
      process.exit()

    process.on("uncaughtException", killWorkers)
    process.on("SIGINT", killWorkers)
    process.on("SIGTERM", killWorkers)

  )

