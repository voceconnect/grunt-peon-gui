###
  peon-chrome
###


module.exports = (grunt) ->
  grunt.initConfig(
    jshint:
      all: [
        'Gruntfile.js'
        'tasks/*.js'
        '<%= nodeunit.tests %>'
      ]
      options:
        jshintrc: '.jshintrc'

    clean:
      tests: ['tmp']

    watch:
      tests:
        files: 'test/*.js'
        tasks: ['jshint']

    devtools:
      default_options:
        files:
          'tmp/default_options': ['test/fixtures/testing', 'test/fixtures/123']
      custom_options:
        options:
          separator: ': '
          punctuation: ' !!!'
        files:
          'tmp/custom_options': ['test/fixtures/testing', 'test/fixtures/123']

    nodeunit:
      tests: ['test/*_test.js']

  )

  grunt.loadTasks('tasks')

  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-nodeunit')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('test', ['clean', 'devtools', 'nodeunit'])
  grunt.registerTask('mycleanalias', ['clean'])
  grunt.registerTask('dev', ['watch'])

  grunt.registerTask('default', ['jshint', 'test'])
