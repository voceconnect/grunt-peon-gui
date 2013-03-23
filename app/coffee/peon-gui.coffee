window.PeonGUI = class PeonGUI

  $html =
    body: $("body")
    projectName: $("#project-name")
    tasks: $("#tasks")
    taskInfo: $("#task-info")
    actionButtons: $("#action-buttons")
    runTask: $("#run-task")
    killTask: $("#kill-task")
    clearConsole: $("#clear-console")
    progressBar: $("#running")
    output: $("#output")
    notice: $("#notice")
  running: false

  disableActivity: () ->
    @running = true
    $html.body.addClass('running')
    $html.progressBar.removeClass('hidden')
    $html.tasks.find('a').prop('disabled', true)

  enableActivity: () ->
    @running = false
    $html.body.removeClass('running')
    $html.progressBar.addClass('hidden')
    $html.tasks.find('a').prop('disabled', false)

  updateTaskInfo: (task) ->
    _taskObject = @project.tasks[task]
    o =
      name: _taskObject.name
      info: _taskObject.info
      example: ""
      configurations: ""
      cliArgs: ""
    codeRegex = /\`{1,3}(\s*?.*?)*?\`{1,3}/gi
    codeExample = _taskObject.info.match(codeRegex)
    if codeExample
      codeExample = codeExample[0].replace(/`/gi, '')
    try
      codeExample = JSON.stringify(JSON.parse("{" + codeExample + "}"), null, 4)
      tmplData =
        title: "Show Help Example"
        content: codeExample
      o.example = _.template(guiTmpls.accordian, tmplData)
      o.info = _taskObject.info.replace(codeRegex, '')
    catch error
      console.log error
    if _taskObject.config.indexOf('{') >= 0
      tmplData =
        title: "Show Configurations"
        content: _taskObject.config
      o.configurations = _.template(guiTmpls.accordian, tmplData)
    else
      o.configurations = """
                         <p class="text-warning">
                         <em>
                         No configurations set.
                         If needed, you can pass colon delimted arguments below.
                         </em>
                         </p>
                         """
      o.cliArgs = '<input type="text" id="task-config" />'
    try
      taskJSON = JSON.parse(_taskObject.config)
      if Object.keys(taskJSON).length > 1
        tmplData =
          title: "Select a Configuration"
          options: Object.keys(taskJSON)
        o.cliArgs = _.template(guiTmpls.dropdown, tmplData)
      else if Object.keys(taskJSON).length > 0
        o.configurations = """
                           <p class="text-warning">
                           <em>
                           Only one configuration target defined.
                           </em>
                           </p>
                           """
        o.cliArgs = ''
    catch error
      console.log error

    $html.taskInfo.html(_.template(guiTmpls.taskInfo, o))

  setProject: () ->
    if @running is false
      $html.output.html('')
    if @project
      tmplData =
        projectEls: @project.tasks
      $html.tasks.html(_.template(guiTmpls.taskList, tmplData))
      @bindButtons()

  handleSocketOpen: () =>
    $html.body.removeClass('offline').addClass('online')
    @socket.send('connect')
    @socket

  handleSocketMessage: (event) =>
    if event.data
      try
        eventData = JSON.parse(event.data);
      catch error
        console.log error
        eventData =
          action: false
      eventMessage = event.data
      if eventData and eventData.project
        @project =
          name: eventData.project
          port: parseInt(eventData.port, 10)
          socket: socket
          tasks: eventData.tasks
        @setProject()
        $html.projectName.html(@project.name)
      else if eventData and eventData.action is 'done'
        @enableActivity()
      if eventMessage.length > 1 and eventData.action isnt 'connected' and eventData.action isnt 'done'
        tmplData =
          time: new Date().toString().split(' ')[4]
          message: eventMessage
        $html.output.prepend(_.template(guiTmpls.outputLog, tmplData))
    else
      console.log event

  handleSocketClose: (e) =>
    $html.notice.removeClass('hidden')

  handleSocketError: (error) =>
    $html.notice.removeClass('hidden')
    console.log(error)

  connect: (wsPort) ->
    @socket = new WebSocket("ws://localhost:#{wsPort}", 'echo-protocol')
    @socket.onopen = @handleSocketOpen
    @socket.onmessage = @handleSocketMessage
    @socket.onclose = @handleSocketClose
    @socket.onerror = @handleSocketError
    @socket

  bindButtons: () ->
    that = @
    $html.tasks.on('click', 'a', (e) ->
      e.preventDefault()
      taskName = $(this).data('task')
      $(this).parent('li').siblings().removeClass('active')
      $(this).parent('li').addClass('active')
      that.currentTask =
        name: taskName
        output: ''
      $html.actionButtons.removeClass('hidden')
      that.updateTaskInfo(taskName)
      $('html,body').scrollTop(0)
    )
    $html.runTask.on('click', (e) ->
      e.preventDefault()
      $taskSelector = $('#task-config')
      if $taskSelector and $taskSelector.val()
        that.currentTask.name = that.currentTask.name + ":" + $taskSelector.val()
      that.socket.send(that.currentTask.name)
      that.disableActivity()
    )
    $html.killTask.on('click', (e) ->
      e.preventDefault()
      that.enableActivity()
      $html.output.html('')
    )
    $html.clearConsole.on('click', (e) ->
      e.preventDefault()
      $html.output.html('')
    )

  constructor: (wsPort) ->
    @connect(wsPort)
    console.log @