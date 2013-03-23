(function() {
  var PeonGUI,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.PeonGUI = PeonGUI = (function() {
    var $html;

    $html = {
      body: $("body"),
      projectName: $("#project-name"),
      tasks: $("#tasks"),
      taskInfo: $("#task-info"),
      actionButtons: $("#action-buttons"),
      runTask: $("#run-task"),
      killTask: $("#kill-task"),
      clearConsole: $("#clear-console"),
      progressBar: $("#running"),
      output: $("#output"),
      notice: $("#notice")
    };

    PeonGUI.prototype.running = false;

    PeonGUI.prototype.disableActivity = function() {
      this.running = true;
      $html.body.addClass('running');
      $html.progressBar.removeClass('hidden');
      return $html.tasks.find('a').prop('disabled', true);
    };

    PeonGUI.prototype.enableActivity = function() {
      this.running = false;
      $html.body.removeClass('running');
      $html.progressBar.addClass('hidden');
      return $html.tasks.find('a').prop('disabled', false);
    };

    PeonGUI.prototype.updateTaskInfo = function(task) {
      var codeExample, codeRegex, error, o, taskJSON, tmplData, _taskObject;

      _taskObject = this.project.tasks[task];
      o = {
        name: _taskObject.name,
        info: _taskObject.info,
        example: "",
        configurations: "",
        cliArgs: ""
      };
      codeRegex = /\`{1,3}(\s*?.*?)*?\`{1,3}/gi;
      codeExample = _taskObject.info.match(codeRegex);
      if (codeExample) {
        codeExample = codeExample[0].replace(/`/gi, '');
      }
      try {
        codeExample = JSON.stringify(JSON.parse("{" + codeExample + "}"), null, 4);
        tmplData = {
          title: "Show Help Example",
          content: codeExample
        };
        o.example = _.template(guiTmpls.accordian, tmplData);
        o.info = _taskObject.info.replace(codeRegex, '');
      } catch (_error) {
        error = _error;
        console.log(error);
      }
      if (_taskObject.config.indexOf('{') >= 0) {
        tmplData = {
          title: "Show Configurations",
          content: _taskObject.config
        };
        o.configurations = _.template(guiTmpls.accordian, tmplData);
      } else {
        o.configurations = "<p class=\"text-warning\">\n<em>\nNo configurations set.\nIf needed, you can pass colon delimted arguments below.\n</em>\n</p>";
        o.cliArgs = '<input type="text" id="task-config" />';
      }
      try {
        taskJSON = JSON.parse(_taskObject.config);
        if (Object.keys(taskJSON).length > 1) {
          tmplData = {
            title: "Select a Configuration",
            options: Object.keys(taskJSON)
          };
          o.cliArgs = _.template(guiTmpls.dropdown, tmplData);
        } else if (Object.keys(taskJSON).length > 0) {
          o.configurations = "<p class=\"text-warning\">\n<em>\nOnly one configuration target defined.\n</em>\n</p>";
          o.cliArgs = '';
        }
      } catch (_error) {
        error = _error;
        console.log(error);
      }
      return $html.taskInfo.html(_.template(guiTmpls.taskInfo, o));
    };

    PeonGUI.prototype.setProject = function() {
      var tmplData;

      if (this.running === false) {
        $html.output.html('');
      }
      if (this.project) {
        tmplData = {
          projectEls: this.project.tasks
        };
        $html.tasks.html(_.template(guiTmpls.taskList, tmplData));
        return this.bindButtons();
      }
    };

    PeonGUI.prototype.handleSocketOpen = function() {
      $html.body.removeClass('offline').addClass('online');
      this.socket.send('connect');
      return this.socket;
    };

    PeonGUI.prototype.handleSocketMessage = function(event) {
      var error, eventData, eventMessage, tmplData;

      if (event.data) {
        try {
          eventData = JSON.parse(event.data);
        } catch (_error) {
          error = _error;
          console.log(error);
          eventData = {
            action: false
          };
        }
        eventMessage = event.data;
        if (eventData && eventData.project) {
          this.project = {
            name: eventData.project,
            port: parseInt(eventData.port, 10),
            socket: socket,
            tasks: eventData.tasks
          };
          this.setProject();
          $html.projectName.html(this.project.name);
        } else if (eventData && eventData.action === 'done') {
          this.enableActivity();
        }
        if (eventMessage.length > 1 && eventData.action !== 'connected' && eventData.action !== 'done') {
          tmplData = {
            time: new Date().toString().split(' ')[4],
            message: eventMessage
          };
          return $html.output.prepend(_.template(guiTmpls.outputLog, tmplData));
        }
      } else {
        return console.log(event);
      }
    };

    PeonGUI.prototype.handleSocketClose = function(e) {
      return $html.notice.removeClass('hidden');
    };

    PeonGUI.prototype.handleSocketError = function(error) {
      $html.notice.removeClass('hidden');
      return console.log(error);
    };

    PeonGUI.prototype.connect = function(wsPort) {
      this.socket = new WebSocket("ws://localhost:" + wsPort, 'echo-protocol');
      this.socket.onopen = this.handleSocketOpen;
      this.socket.onmessage = this.handleSocketMessage;
      this.socket.onclose = this.handleSocketClose;
      this.socket.onerror = this.handleSocketError;
      return this.socket;
    };

    PeonGUI.prototype.bindButtons = function() {
      var that;

      that = this;
      $html.tasks.on('click', 'a', function(e) {
        var taskName;

        e.preventDefault();
        taskName = $(this).data('task');
        $(this).parent('li').siblings().removeClass('active');
        $(this).parent('li').addClass('active');
        that.currentTask = {
          name: taskName,
          output: ''
        };
        $html.actionButtons.removeClass('hidden');
        that.updateTaskInfo(taskName);
        return $('html,body').scrollTop(0);
      });
      $html.runTask.on('click', function(e) {
        var $taskSelector;

        e.preventDefault();
        $taskSelector = $('#task-config');
        if ($taskSelector && $taskSelector.val()) {
          that.currentTask.name = that.currentTask.name + ":" + $taskSelector.val();
        }
        that.socket.send(that.currentTask.name);
        return that.disableActivity();
      });
      $html.killTask.on('click', function(e) {
        e.preventDefault();
        that.enableActivity();
        return $html.output.html('');
      });
      return $html.clearConsole.on('click', function(e) {
        e.preventDefault();
        return $html.output.html('');
      });
    };

    function PeonGUI(wsPort) {
      this.handleSocketError = __bind(this.handleSocketError, this);
      this.handleSocketClose = __bind(this.handleSocketClose, this);
      this.handleSocketMessage = __bind(this.handleSocketMessage, this);
      this.handleSocketOpen = __bind(this.handleSocketOpen, this);      this.connect(wsPort);
      console.log(this);
    }

    return PeonGUI;

  })();

}).call(this);
