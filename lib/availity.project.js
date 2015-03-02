var AdmZip = require('adm-zip');
var BPromise = require('bluebird');
var exec = require('child_process').execFileSync;
var fs = require('fs-extra');
var gitlab = require('./availity.gitlab');
var logger = require('./logger');
var mkdirp = require('mkdirp');
var npm = require('npm');
var path = require('path');
// var ProgressBar = require('progress');
// var rp = require('request');
var rp = require('request-promise');
// var unzip = require('unzip');
// var https = require('https');
var utils = require('./availity.utils');
var mkdirp = require('mkdirp');

var AvProject = function(){
  this.toolkitUrl = 'https://git.availity.com/plugins/servlet/archive/projects/API/repos/availity-toolkit?at=refs/heads/master';
  this.projectDirectoryError = process.cwd() + ' is not an Availity project directory';
};

var proto = AvProject.prototype;

proto.onError = function(err) {
  logger.error(err);
  process.exit(1);
};

proto.initializeGitProject = function() {
  try {
    exec('git', ['init']);
    return true;
  } catch (err) {
    return false;
  }
};

proto.currentDirectoryName = function() {
  return process.cwd().split('/').pop();
};

proto.currentDirectoryIsGitProject = function() {
  return fs.existsSync('./.git/config');
};

proto.currentDirectoryIsAvailityProject = function() {
  return fs.existsSync(utils.projectConfigurationFile);
};

proto.createProjectDirectory = function(projectName) {
  if (!fs.existsSync(projectName)) {
    logger.info('Creating directory ' + projectName);
    try {
      mkdirp.sync(projectName);
    } catch (err) {
      this.onError('Failed to create directory ' + projectName);
    }
  }
};

proto.saveConfiguration = function(name, parameters) {
  logger.info('Saving configuration');
  try {
    fs.writeFileSync(name + '/' + utils.projectConfigurationFile, JSON.stringify(parameters, null, 2));
  } catch (err) {
    console.log('err', err);
    this.onError('Failed to create configuration file: ' + err);
  }
};

proto.configuration = function() {
  try {
    return JSON.parse(fs.readFileSync(utils.projectConfigurationFile, { encoding: 'utf8'}));
  } catch (err) {
    this.onError(err);
  }
};

proto.downloadToolkit = function(path, url) {
  return new BPromise(function (resolve, reject) {
    var req = rp({uri:url, strictSSL: false});
    req
    .pipe(fs.createWriteStream(path + '/toolkit.zip'));

    req
    .finally(function() {
      resolve();
    }).catch(function(err) {
      console.log('download error: ',err);
      reject(this.onError('Failed to download toolkit: ' + err));
    });
  });
};

proto.unzipFile = function(readPath, writePath) {
  var zip = new AdmZip(readPath);
  zip.extractAllTo(writePath, true);
};

proto.popTopDir = function(readPath, writePath) {
  var sourcePath = writePath + '/availity-toolkit-master';
  var fileList = fs.readdirSync(sourcePath);
  fileList.forEach(function(file) {
    fs.move(sourcePath + '/' + file, writePath + '/' + file, function(err) {
      if( err ) {
        logger.error('Error moving toolkit files: ' + err);
      }
    });
  });
  //move these out into a cleanup task
  fs.remove(readPath);
  fs.remove(sourcePath);
};

proto.npmInstall = function() {
  return new BPromise(function (resolve,reject) {
    logger.info('Installing packages...');
    var npmOptions = {
      color: 'always'
    };
    //logger.mute(); // Mute stdout so we don't show the tree of installed packages
    npm.load(npmOptions, function (err) {
      // catch errors
      if (err) {
        logger.unmute();
        reject(logger.error('NPM load error: ' + err));
      }
      npm.commands.install([], function (er) {
        logger.unmute();
        // log the error or data
        if (er) {
          reject(logger.error('NPM install error: ' + er));
        }
        resolve(logger.info('Package installation complete'));
      });
    });
  });
};

proto.applicationInitialized = function(name, toolkitInstalled) {
  logger.success('Project ' + name + ' initialized');
  logger.success('Next Steps:');
  if (toolkitInstalled) {
    logger.success('* Read the documentation for the Availity Toolkit (https://github.com/Availity/availity-toolkit)');
  } else {
    logger.success('* Install Availity UIKit using instructions for your package manager:');
    logger.success('    NPM:   npm install --save availity-uikit');
    logger.success('    Bower: bower install --save availity-uikit');
    logger.success('    None:  git submodule add git@github.com:Availity/availity-uikit.git');
  }
  logger.success('* Develop your application');
  logger.success('* Use availity create to begin deploying your application');
};

proto.initApplication = function(name, parameters) {
  
  parameters['name'] = name === '.' ? this.currentDirectoryName() : name;
  logger.info('\nCreating project ' + parameters['name']);
  
  this.createProjectDirectory(name);
  this.saveConfiguration(name, parameters);

  var wantsToolkit = parameters['toolkit'];
  var writePath = path.normalize(process.cwd() + '/' + name);
  var readPath = writePath + '/toolkit.zip';
  var self = this;
  this.downloadToolkit(writePath, this.toolkitUrl)
  .then(function(){
    self.unzipFile(readPath, writePath);
  })
  .then(function(){
    if(self.currentDirectoryName() !== name ) {
      process.chdir(writePath);
    } 
    return self.npmInstall();
  })
  .then(function(){
    self.applicationInitialized(name, wantsToolkit);
  });
};

proto.create = function(environment) {
  if (!this.currentDirectoryIsAvailityProject()) {
    logger.error(this.projectDirectoryError);
  } else {
    var userConfiguration = require('./availity.user.configuration');
    var token = userConfiguration.getCredentials(environment);
    if (token === null) {
      logger.error('You must log in to ' + environment + ' first.');
    } else {
      if (this.currentDirectoryIsGitProject() || this.initializeGitProject()) {
        gitlab.createProject(userConfiguration.getCredentials(environment), this.configuration().name, environment)
        .then(function(remoteUrl) {
          try {
            exec('git', ['remote', 'add', 'availity', remoteUrl]);
            logger.success('Created project on Availity deployment server');
          } catch (err) {
            this.onError('Failed to add Git remote. Please run:\n  git remote add availity ' + remoteUrl);
          }
        })
        .catch(function(err) {
          var message = '';
          for (var key in err) {
            message += '\n' + key + ' ' + err[key];
          }
          this.onError(message.length > 0 ? message.substring(1) : 'Cannot create project on Availity server');
        });
      } else {
        this.onError('Cannot initialize project as a Git repository');
      }
    }
  }
};

proto.deploy = function(environment) {
  if (!this.currentDirectoryIsAvailityProject()) {
    logger.error(this.projectDirectoryError);
  } else {
    if (!environment) {
      return logger.errorString('You must specify the deployment environment');
    }
  }
};

proto.submit = function() {
  if (!this.currentDirectoryIsAvailityProject()) {
    logger.error(this.projectDirectoryError);
  }
};

proto.init = function(name){

  var self = this;

  var properties = [
    {
      name: 'description',
      description: 'Enter a description for your application:'.yellow,
      type: 'string',
      required: true
    },
    {
      name: 'version',
      description: 'Enter the version of your application:'.yellow,
      message: 'Version must be only numbers'.red,
      type: 'string',
      pattern: /^\d{1,2}\.\d{1,2}\.\d{1,2}$/,
      default: '0.1.0',
      required: true
    },
    {
      name: 'toolkit',
      message: 'Use our Developer Toolkit?'.yellow,
      warning: 'Must respond yes or no',
      type: 'string',
      validator: /y[es]*|n[o]?/,
      required: true,
      before: function(value) { return (value === 'yes' || value === 'y');}
    }
  ];

  // If name is blank, use the current directory.
  if (!name || name.length === 0) {
    name = '.';
  }

  var prompt = utils.prompt;
  prompt.start();

  prompt.get(properties, function(err, result) {
    self.initApplication(name, result);
  });
};


module.exports = new AvProject();