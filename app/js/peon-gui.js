/*global window, document, console, $, jQuery, _, setTimeout, WebSocket,
 handleSocketOpen, handleSocketMessage, handleSocketClose, handleSocketError,
 parseInt, alert */

var PeonGUI = (function () {
    'use-strict';
    var sockets = [61750, 61751, 61752, 61753, 61754],
        currentProject,
        $html = {
            output: $("#placeOutput"),
            body: $("body"),
            tasks: $("#tasks"),
            regularTasks: $("#placeTasks"),
            projects: $("#placeProjects"),
            taskInfo: $("#taskInfo"),
            actionButtons: $("#action-buttons"),
            runTask: $("#run-task"),
            killTask: $("#kill-task"),
            clearConsole: $("#clearConsole"),
            progress: $("running")
        },
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
            html = "<h2><%= name %></h2><p><%= info %></p><pre><%= config %></pre>";
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

    function handleSocketOpen() {
        $html.body.removeClass('offline').addClass('online');
        try {
            sockets.forEach(function (socket) {
                socket.send('connect');
            });
        } catch (err) {
            console.log(err);
        }
    }

    function handleSocketMessage(event) {
        if (event.data) {
            try {
                var data = JSON.parse(event.data);
            } catch (err) {
                console.log(JSON.parse(event.data));
                return;
            }
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
        var i = startPort,
            projectPorts = projects.map(function (project) {return project.port;})
        for (i; i < maxPort; i++) {
            if (jQuery.inArray(i, projectPorts) === -1 && window.hasOwnProperty("WebSocket")) {
                try {
                    sockets[i] = new WebSocket('ws://localhost:' + i, 'echo-protocol');
                    sockets[i].onopen = handleSocketOpen;
                    sockets[i].onmessage = handleSocketMessage;
                    sockets[i].onclose = handleSocketClose;
                    sockets[i].onerror = handleSocketError;
                } catch (err) {
                    console.log(err);
                }
            }
        }

        setTimeout(connect, 10000);
    }

    return function () {
        connect();
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
            currentProject.socket.send(currentTask.name);
            $html.progress.show();
            disableActivity();
        });

        $html.clearConsole.on('click', function (e) {
            e.preventDefault();
            $html.output.html('');
        });

        $html.projects.on('click', 'a', function (e) {
            e.preventDefault();
            setProject($(this).data('task'));
        });
    };

}());