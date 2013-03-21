/*global require, module */
var grunt = require('grunt'),
    ps = require('portscanner'),
    PeonWebSocket = require('../lib/peon-web-socket');

module.exports = {
    setUp: function (callback) {
        this.PWS = new PeonWebSocket(grunt);
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    configTaskRemoved: function (test) {
        if (this.PWS.tasks.length) {
            test.expect(1);
            var taskLength = this.PWS.tasks.length;
            this.PWS.removeTasks(this.PWS.tasks[0]);
            test.equals(this.PWS.tasks.length, taskLength - 1, "Should remove specified task(s) " + taskLength);
            test.done();
        } else {
            test.done();
        }
    }
};