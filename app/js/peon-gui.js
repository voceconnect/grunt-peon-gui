/*global window, document, console, $, jQuery, _, setTimeout, WebSocket,
 handleSocketOpen, handleSocketMessage, handleSocketClose, handleSocketError,
 parseInt, alert */

var PeonGUI = (function () {
    'use-strict';
    var socket,
        currentProject,
        $html = {
            output: $("#placeOutput"),
            body: $("body"),
            tasks: $("#tasks"),
            regularTasks: $("#placeTasks"),
            projects: $("#placeProjects"),
            taskInfo: $("#taskInfo"),
            runTask: $("#runTask"),
            clearConsole : $("#clearConsole"),
            progress: $("running")
        },
        startPort = 61749,
        currentPort = startPort,
        maxPort = currentPort + 5,
        projects = [],
        running = false,
        currentTask;

    function disableActivity() {
        running = true;
        $html.body.addClass('running');
        $('#tasks a, #projects a').prop('disabled', true);
    }

    function enableActivity() {
        running = false;
        $html.body.removeClass('running');
        $('#tasks a, #projects a').prop('disabled', false);
    }

    function updateProjectList() {
        var html = "";
        _.each(projects, function (project, i) {
            html = html + '<li><a href="#" data-id="' + i + '">' + project.name + '</a></li>';
        });
        $html.projects.html(html);
    }

    function updateTaskInfo(task) {
        var taskObject = currentProject.tasks[task],
            html = "<h2><%= name %></h2><p><%= info %></p><button class='btn btn-success' id='runTask' data-name='<%= name %>'>Run</button>&nbsp;<button id='killTask' class='btn btn-danger'>Stop</button>";
        $html.taskInfo.html(_.template(html, taskObject));
    }

    function setProject(idx) {
        if (running === false) {
            var projectEls, taskListTpl;
            currentProject = projects[idx];
            projectEls = $html.projects.find('a');
            projectEls.parent("li").removeClass('active');
            $(projectEls.get(idx)).parent("li").addClass('active');
            $html.output.html('');
            if (currentProject) {
                taskListTpl = "<% _.each(projectEls, function(task) { %> <li><a href='#' data-task='<%= task.name %>'><%= task.name %></a></li><% }); %>";
                $html.regularTasks.html(_.template(taskListTpl, {projectEls: currentProject.tasks}));
            }
        }
    }

    function handleSocketOpen(e) {
        $html.body.removeClass('offline').addClass('online');
        socket.send('connect');
    }

    function handleSocketMessage(event) {
        if (event.data) {
            var data = JSON.parse(event.data);
            if (data && data.project) {
                projects.push({
                    name: data.project,
                    port: parseInt(data.port, 10),
                    socket: socket,
                    tasks: data.tasks
                });
                updateProjectList();
                setProject(projects.length - 1);
            } else if (data && data.action === 'done') {
                enableActivity();
            }
            if (event.data.indexOf('Running Task:') === 0) {
                $html.output.html('');
            } else if (data.length > 1 && data.action != 'connected') {
                $html.output.append("<p>" + new Date().toString().split(' ')[4] + ' - ' + event.data + "</p>");
            }
        }

    }

    function handleSocketClose(e) {
        var closedPort = parseInt(e.currentTarget.URL.split(':')[2].replace(/\D/g, ''), 10),
            newProjects = _.reject(projects, function (el) {
                return el.port === closedPort;
            });

        if (newProjects.length !== projects.length) {
            if (closedPort === currentProject.port && running) {
                enableActivity();
            }

            projects = newProjects;
            updateProjectList();
            setProject(projects.length - 1);
        } else {
            projects = newProjects;
        }
    }

    function handleSocketError(error) {
        console.log(error);
    }

    function connect() {
        var exists = _.find(projects, function (project) {
            return project.port === currentPort;
        });

        // if no project on that port
        if (!exists) {
            socket = new WebSocket('ws://localhost:' + currentPort, 'echo-protocol');
            socket.onopen = handleSocketOpen;
            socket.onmessage = handleSocketMessage;
            socket.onclose = handleSocketClose;
            socket.onerror = handleSocketError;
        }

        if (maxPort === currentPort) {
            currentPort = startPort;
        }
        currentPort++;
        setTimeout(connect, 1000);
    }

    return function () {
        connect();
        $html.tasks.on('click', 'a', function () {
            var taskName = $(this).data('task');
            currentTask = {name: taskName, output: ''};
            updateTaskInfo(taskName);
        });

        $html.runTask.on('click', 'a', function () {
            var taskName = $(this).data('task');
            currentTask = {name: taskName, output: ''};
            currentProject.socket.send(taskName);
            $html.progress.show();
            disableActivity();
        });

        $html.clearConsole.click(function () {
            $html.output.html('');
        });

        $html.projects.on('click', 'a', function () {
            setProject($(this).data('task'));
        });
    };

}());