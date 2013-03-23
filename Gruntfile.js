/*
 * grunt-peon-gui
 * Creates a local webserver GUI tool to run Grunt tasks
 *
 * Copyright (c) 2013 Mark Parolisi, contributors
 * Licensed under the MIT license.
 */

/*global module */
module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        compass: {
            app: {
                options: {
                    sassDir: 'app/sass',
                    cssDir: 'app/assets/css'
                }
            }
        },
        coffee: {
            app: {
                files: {
                    'app/assets/js/peon-gui.js': 'app/coffee/peon-gui.coffee'
                }
            }
        },
        jshint: {
            app: [
                'Gruntfile.js',
                'app/js/*.js',
                '<%= nodeunit.tests %>'
            ]
        },
        coffeelint: {
            app: ['lib/*.coffee', 'tasks/*.coffee']
        },
        nodeunit: {
            tests: ['tests/*_test.js']
        },
        watch: {
            app: {
                files: ['**/*.coffee', '**/*.scss'],
                tasks: ['default'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-coffeelint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.registerTask('default', ['coffeelint', 'coffee', 'compass', 'jshint', 'nodeunit']);
};