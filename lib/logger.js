var chalk = require('chalk');

var level = 5;
var consoleLog = console.log;

var log = function(message) {
    console.log(message);

};

module.exports = {
    mute: function() {
        console.log = function() {};
    },

    unmute: function() {
        console.log = consoleLog;
    },

    setLevel: function(verboseLevel) {
        level = verboseLevel;
    },

    errorString: function(message) {
        return chalk.red(message);
    },

    warningString: function(message) {
        return chalk.yellow(message);
    },

    infoString: function(message) {
        return chalk.gray(message);
    },

    emphasisString: function(message) {
        return chalk.blue(message);
    },

    successString: function(message) {
        return chalk.green(message);
    },

    success: function(message) {
        log(this.successString(message));
    },

    error: function(message) {
        if (level > 0) {
            log(this.errorString(message));
        }
    },

    warning: function(message) {
        if (level > 1) {
            log(this.warningString(message));
        }
    },

    info: function(message) {
        if (level > 2) {
            log(this.infoString(message));
        }
    },

    emphasis: function(message) {
        if (level > 3) {
            log(this.emphasisString(message));
        }
    }

};
