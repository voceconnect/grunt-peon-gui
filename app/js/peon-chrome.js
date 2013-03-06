/*global window, document, $, jQuery, _, setTimeout, WebSocket,
handleSocketOpen, handleSocketMessage, handleSocketClose, handleSocketError,
parseInt, alert */
var socket,
    currentProject,
    $html = {
        output: $("#placeOutput"),
        body: $("body"),
        tasks: $("#tasks"),
        bgSection: $("#backgroundTasks"),
        bgTasks: $("#placeBackgroundTasks"),
        regularTasks: $("#placeTasks"),
        aliasTasks: $("#placeAliasTasks"),
        projects: $("#placeProjects")
    },
    startPort = 61749,
    currentPort = startPort,
    maxPort = currentPort + 5,
    projects = [],
    running = false,
    currentTask;

/**
 * Connect to a devtools socket
 */
function connect(port) {
    var socketAddr,
        exists = _.find(projects, function (project) {
            return project.port === currentPort;
        });

    if (!exists) {
        socketAddr = 'ws://localhost:' + currentPort;
        if (port) {
            socketAddr = 'ws://localhost:' + port;
        }
        socket = new WebSocket(socketAddr, 'echo-protocol');
        socket.onopen = handleSocketOpen;
        socket.onmessage = handleSocketMessage;
        socket.onclose = handleSocketClose;
        socket.onerror = handleSocketError;
    }

    if (maxPort === currentPort) {
        currentPort = startPort;
    }
    currentPort = currentPort + 1;
    setTimeout(connect, 1000);
}

function handleSocketOpen(e) {
    $html.body.removeClass('offline').addClass('online');
    socket.send('connect');
}

function handleSocketMessage(event) {
    try {
        var data = JSON.parse(event.data);
        if (data && data.project) {
            // connecting a new project
            // add this new project
            projects.push({
                name: data.project,
                port: parseInt(data.port),
                socket: socket,
                alias: data.alias,
                tasks: data.tasks,
                backgroundTasks: []
            });
            updateProjectList();
            // set to current to latest, if not running
            setProject(projects.length - 1);

        }
        else if (data && data.action === 'done') {
            enableActivity();
        }
    } catch (e) {
        // new task
        if (event.data.indexOf('Running Task:') === 0) {
            $html.output.html('');
        } else if (event.data.length > 1) {
            $html.output.append('<pre>' + new Date().toString().split(' ')[4] + ' - ' + event.data + '</pre>');
        }
    }
}

/**
 * Handle a socket close
 * @param e event
 */
function handleSocketClose(e) {
    // port that was just closed
    var closedPort = parseInt(e.currentTarget.URL.split(':')[2].replace(/\D/g, ''));
    // remove this project
    var newProjects = _.reject(projects, function (el) {
        return el.port === closedPort;
    });

    // if disconnected a real socket
    if (newProjects.length !== projects.length) {
        // if we disconnected the active project and it was running
        if (closedPort === currentProject.port && running) {
            enableActivity();
        }

        projects = newProjects;
        updateProjectList();
        setProject(projects.length - 1);
    } else {
        projects = newProjects;
    }
    if (projects.length === 0) {
        $html.body.removeClass('online').addClass('offline');
    }
}

/**
 * Handle socket error
 */
function handleSocketError() {
    alert('Something went really wrong, please report this...');
}

function updateProjectList() {
    var projectListTpl = "<% _.each(projects, function(project, i) { %> <button value='<%= i %>'><%= project.name %></button><% }); %>";
    $html.projects.html(_.template(projectListTpl, projects));
}

function setProject(idx) {
    // if not running, change the active project. Otherwise it stays the same
    if (!running) {
        // get project by index
        currentProject = projects[idx];
        // update project tab style
        var buttons = $html.projects.find('button');
        buttons.removeClass('active');
        $(buttons.get(idx)).addClass('active');
        // clear output
        $html.output.html('');
        // update task lists for this project
        if (currentProject) {
            // set the tasks
            var taskListTpl = "<% _.each(buttons, function(name) { %> <button value='<%= name %>'><%= name %></button><% }); %>";
            $html.regularTasks.html(_.template(taskListTpl, {buttons: currentProject.tasks}));
            $html.aliasTasks.html(_.template(taskListTpl, {buttons: currentProject.alias}));
            if (currentProject.backgroundTasks.length > 0) {
                $html.bgSection.addClass('show');
                $html.bgTasks.html(_.template(taskListTpl, {buttons: currentProject.backgroundTasks}));
            } else {
                $html.bgSection.removeClass('show');
            }
        }
    }
}

/**
 * Connect!
 */
connect();

/**
 * Button Events
 */

// execute task
$html.tasks.on('click', 'button', function () {
    currentProject.socket.send($(this).val());
    currentTask = {name: $(this).val(), output: ''};
    disableActivity();
});

// switch projects
$html.projects.on('click', 'button', function () {
    var $idx = $(this).val();
    setProject($idx);
});

// send task to background
$('#sendBackground').on('click', function () {
    if (currentTask) {
        currentProject.backgroundTasks.push(currentTask);
    }
    connect(currentProject.port);
    enableActivity();
});

function disableActivity() {
    running = true;
    $html.body.addClass('running');
    $('#tasks button, #projects button').prop('disabled', true);
}

function enableActivity() {
    running = false;
    $html.body.removeClass('running');
    $('#tasks button, #projects button').prop('disabled', false);
}