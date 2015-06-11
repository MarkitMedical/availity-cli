var path = require('path');
var BPromise = require('bluebird');
var fs = require('fs');
var config = require('./config');
var utils = require('./utils');
var logger = require('../logger');
var GitLab = require('./gitlab');


var sshDirectory = path.join(utils.homeDirectory, '.ssh');
var publicKeyFile = path.join(sshDirectory, 'id_rsa.pub');
var privateKeyFile = path.join(sshDirectory, 'id_rsa');

var keyPairExists = function() {
    return fs.existsSync(publicKeyFile) && fs.existsSync(privateKeyFile);
}

var generateKeyPair = function(email, password) {
    // On some Windows machines, ssh-keygen fails if the .ssh directory doesn't exist
    // Not sure why
    if (!fs.existsSync(sshDirectory)) {
        try {
            logger.info('Creating .ssh directory');
            mkdirp.sync(sshDirectory);
        } catch (err) {
            utils.onError('Cannot create .ssh directory in your home directory');
        }
    }
    try {
        exec('ssh-keygen', ['-t', 'rsa', '-b', '2048', '-C', email, '-N', password, '-f', privateKeyFile]);
    } catch (err) {
        utils.onError('SSH key generation failed -- please install ssh-keygen');
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
        return fs.readFileSync(publicKeyFile, {
            encoding: 'utf-8'
        });
    } catch (err) {
        onError(err);
    }
}

proto.login = function() {
    var self = this;
    var environment = config.getSession('environment');

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
    gitlab.login(result.userId, result.password)
    .then(function(token) {
      config.setCredentials(result.userId, token);
    })
    .then(function() {
      createKeyPair()
      .then(function() {
        logger.info('Uploading public key');
        gitlab.uploadKey(config.getCredentials(), self.publicKey())
        .then(function() {
          logger.info('Done!');
        });
        //.catch(function(err) {
        //  utils.onError(err);
        //});
      });
      //.catch(function(err) {
      //  utils.onError(err);
      //});
    });
    //.catch(function(err) {
    //  utils.onError(err);
    //});
  });
};
