var fs = require('fs');
var BPromise = require('bluebird');
var path = require('path');
var exec = require('child_process').execFileSync;
var mkdirp = require('mkdirp');
var utils = require('./availity.utils');
var GitLab = require('./availity.gitlab');
var logger = require('./logger');
var userConfiguration = require('./availity.user.configuration');

var onError = function(err) {
  logger.error(err);
  process.exit(1);
};

var homeDirectory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var sshDirectory = path.join(homeDirectory, '.ssh');
var publicKeyFile = path.join(sshDirectory, 'id_rsa.pub');
var privateKeyFile = path.join(sshDirectory, 'id_rsa');

var keyPairExists = function() {
  return fs.existsSync(publicKeyFile) && fs.existsSync(privateKeyFile);
};

var generateKeyPair = function(email, password) {
  // On some Windows machines, ssh-keygen fails if the .ssh directory doesn't exist
  // Not sure why
  if (!fs.existsSync(sshDirectory)) {
    try {
      logger.info('Creating .ssh directory');
      mkdirp.sync(sshDirectory);
    } catch (err) {
      onError('Cannot create .ssh directory in your home directory');
    }
  }
  try {
    exec('ssh-keygen', ['-t', 'rsa', '-b', '2048', '-C', email, '-N', password, '-f', privateKeyFile]);
  } catch (err) {
    onError('SSH key generation failed -- please install ssh-keygen');
  }
};

var createKeyPair = function() {
  return new BPromise(function(resolve, reject) {
    if (keyPairExists()) {
      resolve();
    } else {
      var propertiesAsk = [{
        name: 'create',
        message: 'No public/private key found; create one?'.yellow,
        validator: /y[es]*|n[o]?/,
        default: 'yes',
        required: true
      }];
      var propertiesEmail = [{
        name: 'email',
        description: 'Email address:'.yellow,
        format: 'email',
        required: true
      }];

      var prompt = utils.prompt;
      prompt.getAsync(propertiesAsk)
      .then(function(result) {
        if (result.create.indexOf('y') === 0) {
          prompt.getAsync(propertiesEmail)
          .then(function(resultEmail) {
            generateKeyPair(resultEmail.email, '');
          })
          .then(function() {
            logger.info('SSH key pair created');
            resolve();
          })
          .catch(function(err) {
            reject(err);
          });
        }
      });
    }
  });
};

var User = module.exports = function() {};

var proto = User.prototype;

proto.publicKey = function() {
  try {
    return fs.readFileSync(publicKeyFile, { encoding: 'utf-8' });
  } catch (err) {
    onError(err);
  }
};

proto.login = function(environment) {
  var self = this;

  var properties = [{
    name: 'userId',
    description: 'User ID:'.yellow,
    type: 'string',
    required: true
  }, {
    name: 'password',
    description: 'Password (will not display):'.yellow,
    type: 'string',
    hidden: true,
    required: true
  }];

  var gitlab = new GitLab();
  var prompt = utils.prompt;
  prompt.getAsync(properties)
  .then(function(result) {
    logger.info('Logging in to Availity ' + environment);
    gitlab.login(result.userId, result.password, environment)
    .then(function(token) {
      userConfiguration.setCredentials(result.userId, token, environment);
    })
    .then(function() {
      createKeyPair()
      .then(function() {
        logger.info('Uploading public key');
        gitlab.uploadKey(userConfiguration.getCredentials(environment), self.publicKey(), environment)
        .then(function() {
          logger.info('Done!');
        })
        .catch(function(err) {
          onError(err);
        });
      })
      .catch(function(err) {
        onError(err);
      });
    })
    .catch(function(err) {
      onError(err);
    });
  });
};

proto.showGroups = function(environment) {
  var gitlab = new GitLab();
  gitlab.getGroups(userConfiguration.getCredentials(environment), environment)
  .then(function(groups) {
    userConfiguration.setGroups(groups, environment);
    for (var i in groups) {
      logger.info(groups[i].name);
    }
  });
};
