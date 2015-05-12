#!/usr/bin/env node
var program = require('commander');
var project = require('./availity.project');
var User = require('./availity.user');
var healthCheck = require('./health.check');
var logger = require('./logger');
var utils = require('./availity.utils');
var pjson = require('../package.json');

var isHealthy = function() {
  var healthy = healthCheck.isHealthy();
  if (!healthy) {
    logger.error('Please correct problems before trying again');
  }
  return healthy;
};

var setup = function() {
  logger.setQuiet(program.quiet);
  program.environment = program.environment || utils.environments.PROD;
  if (utils.environmentNames.indexOf(program.environment) === -1) {
    logger.error('environment must be one of ' + utils.environmentNames.join(', '));
    return false;
  }
  return true;
};

process.stdin.resume();

var exitHandler = function() {
  logger.info('Exiting...');
  process.exit();
}

process.on('exit', exitHandler.bind(null));
process.on('SIGINT', exitHandler.bind(null));

program
  .version(pjson.version)
  .option('-q, --quiet', 'use quiet mode')
  .option('-e, --environment [value]', 'The environment to use [' + utils.environmentNames.join('|') + ']')
  .option('-g, --group [value]', 'The name of the group to use')
  .usage('[options] <command>');

program
  .command('login')
  .description('log in with your Availity developer credentials')
  .action(function() {
    if (setup()) {
      new User().login(program.environment);
    }
  });

program
  .command('init [name]')
  .description('initialize a project in directory [name] or CWD')
  .action(function(name) {
    if (setup()) {
      project.init(name);
    }
  });

program
  .command('create')
  .description('create the current project on the Availity server')
  .action(function() {
    if (setup()) {
      project.create(program.environment, program.group);
    }
  });

program
  .command('deploy')
  .description('deploy the current project to the specified environment')
  .action(function() {
    if (setup()) {
      project.deploy(program.environment);
    }
  });

program
  .command('submit')
  .description('submit the current project for production review')
  .action(function() {
    if (setup()) {
      return project.submit();
    }
  });

program
  .command('doctor')
  .description('perform health check for availity CLI')
  .action(function() {
    if (setup()) {
      return isHealthy();
    }
  });

program
  .command('groups')
  .description('display the groups you belong to on the Availity server')
  .action(function() {
    if (setup()) {
      new User().showGroups(program.environment);
    }
  });

program
  .command('help')
  .description('display this help')
  .action(function() {
    program.help();
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}
