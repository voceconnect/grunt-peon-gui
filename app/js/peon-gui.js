/*global window, document, console, $, jQuery, _, setTimeout, WebSocket,
 handleSocketOpen, handleSocketMessage, handleSocketClose, handleSocketError,
 parseInt, alert, guiTmpls */

var PeonGUI = (function () {
    "use-strict";
    var socket,
        project,
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
        },
        running = false,
        currentTask;

    function disableActivity() {
        running = true;
        $html.body.addClass('running');
        $html.progressBar.removeClass('hidden');
        $('#tasks a, #projects a').prop('disabled', true);
    }

    function enableActivity() {
        running = false;
        $html.body.removeClass('running');
        $html.progressBar.addClass('hidden');
        $('#tasks a, #projects a').prop('disabled', false);
    }

    /**
     * @param task
     */
    function updateTaskInfo(task) {
        var _taskObject = project.tasks[task],
            taskJSON,
            o = {
                name: _taskObject.name,
                info: _taskObject.info,
                example: "",
                configurations: "",
                cliArgs: ""
            },
            codeRegex = /\`{1,3}(\s*?.*?)*?\`{1,3}/gi,
            codeExample = _taskObject.info.match(codeRegex);
        if (codeExample !== null) {
            codeExample = codeExample[0].replace(/`/gi, '');
            try {
                codeExample = JSON.stringify(JSON.parse("{" + codeExample + "}"), null, 4);
                o.example = _.template(guiTmpls.accordian, {title: "Show Help Example", content: codeExample});
                o.info = _taskObject.info.replace(codeRegex, '');
            } catch (error) {}
        }
        if (_taskObject.config.indexOf('{') >= 0) {
            o.configurations = _.template(guiTmpls.accordian, {title: "Show Configurations", content: _taskObject.config});
        } else {
            o.configurations = '<p class="text-warning"><em>No configurations set. If needed, you can pass colon delimted arguments below.</em></p>';
            o.cliArgs = '<input type="text" id="task-config" />';
        }
        try {
            taskJSON = JSON.parse(_taskObject.config);
            if (Object.keys(taskJSON).length > 1) {
                o.cliArgs = _.template(guiTmpls.dropdown, {title: "Select a Configuration", options: Object.keys(taskJSON)});
            }
        } catch (e) {}
        $html.taskInfo.html(_.template(guiTmpls.taskInfo, o));
    }

    function setProject() {
        if (running === false) {
            $html.output.html('');
            if (project) {
                $html.tasks.html(_.template(guiTmpls.taskList, {projectEls: project.tasks}));
            }
        }
    }

    function handleSocketOpen() {
        $html.body.removeClass('offline').addClass('online');
        socket.send('connect');
    }

    function handleSocketMessage(event) {
        if (event.data) {
            var eventData, eventMessage;
            try {
                eventData = JSON.parse(event.data);
            } catch (e) {
                eventData = {action: false};
            }
            eventMessage = event.data;
            if (eventData && eventData.project) {
                project = {
                    name: eventData.project,
                    port: parseInt(eventData.port, 10),
                    socket: socket,
                    tasks: eventData.tasks
                };
                setProject();
                $html.projectName.html(project.name);
            } else if (eventData && eventData.action === 'done') {
                enableActivity();
            }
            if (eventMessage.length > 1 && eventData.action !== 'connected' && eventData.action !== 'done') {
                $html.output.prepend(_.template(guiTmpls.outputLog, {time: new Date().toString().split(' ')[4], message: eventMessage}));
            }
        }

    }

    function handleSocketClose(e) {
        $html.notice.removeClass('hidden');
    }

    function handleSocketError(error) {
        $html.notice.removeClass('hidden');
        console.log(error);
    }

    function connect(wsPort) {
        socket = new WebSocket('ws://localhost:' + wsPort, 'echo-protocol');
        socket.onopen = handleSocketOpen;
        socket.onmessage = handleSocketMessage;
        socket.onclose = handleSocketClose;
        socket.onerror = handleSocketError;
    }

    return function (wsPort) {
        connect(wsPort);
        $html.tasks.on('click', 'a', function (e) {
            e.preventDefault();
            var taskName = $(this).data('task');
            $(this).parent('li').siblings().removeClass('active');
            $(this).parent('li').addClass('active');
            currentTask = {name: taskName, output: ''};
            $html.actionButtons.removeClass('hidden');
            updateTaskInfo(taskName);
            $('html,body').scrollTop(0);
        });

        $html.runTask.on('click', function (e) {
            e.preventDefault();
            var $taskSelector = $('#task-config');
            if ($taskSelector.length > 0 && $taskSelector.val().length > 0) {
                currentTask.name = currentTask.name + ":" + $taskSelector.val();
            }
            project.socket.send(currentTask.name);
            disableActivity();
        });

        $html.killTask.on('click', function (e) {
            e.preventDefault();
            enableActivity();
            $html.output.html('');
        });

        $html.clearConsole.on('click', function (e) {
            e.preventDefault();
            $html.output.html('');
        });
    };

}());