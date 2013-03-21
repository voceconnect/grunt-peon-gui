/*global require, module */
var grunt = require('grunt'),
    ps = require('portscanner'),
    PeonGUIServer = require('../lib/peon-gui-server');

module.exports = {
    setUp: function (callback) {
        this.worker = {
            getSocket: function () {
                return 61750;
            }
        };
        this.PGS = new PeonGUIServer(this.worker);
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    workerSet: function (test) {
        test.expect(1);
        test.deepEqual(this.PGS.worker, this.worker, "worker not set");
        test.done();
    }
};