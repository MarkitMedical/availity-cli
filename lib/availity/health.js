var exec = require('child_process').execSync;
var logger = require('../logger');

var MinimumNodeVersion = 12;

var isInstalled = function(programName, url) {
  var installed = true;
  try {
    exec(programName + ' --version');
  } catch (err) {
    installed = false;
  }
  logger.info('Checking for ' + logger.emphasisString(programName) + ' . . . ' +
              (installed ? logger.successString('OK') :
               logger.errorString('Not installed -- see ' + url + ' to install')));
  return installed;
};

exports.isHealthy = function() {
  // Check node version -- we're grabbing the minor version in major.minor.patch
  var nodeVersion = Number(process.version.match(/^v\d+\.(\d+)/)[1]);
  if (nodeVersion < MinimumNodeVersion) {
    // If the node version is less than MinimumNodeVersion, exec won't run properly
    logger.error('Please upgrade node to at least v0.' + MinimumNodeVersion + '.0');
    return false;
  } else {
    // Check for bower
    var bower = isInstalled('bower', 'http://bower.io/');

    // Check for gulp
    var gulp = isInstalled('gulp', 'http://gulpjs.com/');

    // Check for git
    var git = isInstalled('git', 'http://git-scm.com/');

    return bower && gulp && git;
  }
};
