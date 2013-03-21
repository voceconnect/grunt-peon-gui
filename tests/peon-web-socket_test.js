/*global require, module */
var grunt = require('grunt'),
    ps = require('portscanner'),
    webSocket = require('../lib/peon-web-socket');



module.exports = {
    setUp: function (callback) {
        this.PWS = new webSocket();
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    configTaskRemoved: function (test) {
        test.expect(1);
        var taskLength = this.PWS.tasks.length;
        this.PWS.removeTasks([]);
        test.equals(this.PWS.tasks.length, taskLength - 1, "Should remove specified task(s) " + taskLength);
        test.done();
    }
};