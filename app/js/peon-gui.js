/*global window, document, console, $, jQuery, _, setTimeout, WebSocket,
 handleSocketOpen, handleSocketMessage, handleSocketClose, handleSocketError,
 parseInt, alert */

var PeonGUI = (function () {
    'use-strict';
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


    function updateTaskInfo(task) {
        var taskObject = project.tasks[task],
            html = "<h2><%= name %></h2><p><%= info %></p><pre><%= config %></pre>";
        $html.taskInfo.html(_.template(html, taskObject));
    }

    function setProject() {
        if (running === false) {
            var projectEls, taskListTpl;
            $html.output.html('');
            if (project) {
                taskListTpl = "<% _.each(projectEls, function(task) { %> <li><a href='#' data-task='<%= task.name %>'><%= task.name %></a></li><% }); %>";
                $html.tasks.html(_.template(taskListTpl, {projectEls: project.tasks}));
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
            eventData = JSON.parse(event.data);
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
                $html.output.append("<p>" + new Date().toString().split(' ')[4] + ' - ' + eventMessage + "</p>");
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
        });

        $html.runTask.on('click', function (e) {
            e.preventDefault();
            project.socket.send(currentTask.name);
            disableActivity();
        });

        $html.killTask.on('click', function (e) {
            e.preventDefault();
            $html.output.html('');
        });

        $html.clearConsole.on('click', function (e) {
            e.preventDefault();
            $html.output.html('');
        });
    };

}());