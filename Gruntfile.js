/*
 * peon-gui
 * Creates a local webserver GUI tool to run Grunt tasks
 *
 * Copyright (c) 2013 Mark Parolisi, contributors
 * Licensed under the MIT license.
 */

/*global module */
module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'app/js/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: { }
        },
        coffeelint: {
            app: ['lib/*.coffee', 'tasks/*.coffee']
        },
        nodeunit: {
            tests: ['tests/*_test.js']
        }
    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-coffeelint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.registerTask('default', ['jshint', 'coffeelint', 'nodeunit']);
};