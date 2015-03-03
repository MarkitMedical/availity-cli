var BPromise = require('bluebird');
var request = BPromise.promisifyAll(require('request'));
var utils = require('./availity.utils');

var GitLab = module.exports = function() {
  this.hostnames = {};
  this.hostnames[utils.environments.PROD] = 'https://code.availity.com';
  this.hostnames[utils.environments.QA] = 'https://qa-code.availity.com';
  this.hostnames[utils.environments.TEST] = 'http://agltstpyg01.availity.net';
};

var proto = GitLab.prototype;

proto._apiUrl = function(path) {
  return '/api/v3/' + path;
};

proto._makeUrl = function(path, environment) {
  return this.hostnames[environment] + this._apiUrl(path);
};

// This is the method that actually performs all GETs and POSTs
proto._executeRequest = function(method, resource, environment, token, tokenRequired, data, responseFunction, successFunction) {
  var self = this;
  return new BPromise(function(resolve, reject) {
    // Add standard data to the request
    if (tokenRequired) {
      if (token === null) {
        reject('You are not logged in to ' + environment);
      } else {
        data['headers'] = {};
        data['headers']['PRIVATE-TOKEN'] = token;
      }
    }
    data['strictSSL'] = environment === 'prod';
    var requestMethod = method.toUpperCase() === 'POST' ?
      request.postAsync :
      request.getAsync;
    requestMethod(self._makeUrl(resource, environment), data)
    .then(function(response) {
      return responseFunction(response, resolve, reject);
    })
    .then(JSON.parse)
    .then(function(json) {
      successFunction(json, resolve, reject);
    })
    .catch(SyntaxError, function(err) {
      reject('Cannot interpret response: ' + err);
    })
    .catch(function(err) {
      reject('Unknown error: ' + err);
    });
  });
};

proto.login = function(userId, password, environment) {
  return this._executeRequest('POST', 'session', environment, null, false,
    {
      form: {
        login: userId,
        password: password
      }
    },
    function(response, resolve, reject) {
      /* jshint unused: false */
      return response[0].body;
    },
    function(json, resolve, reject) {
      if (json['private_token']) {
        resolve(json['private_token']);
      } else {
        reject(json['message']);
      }
    }
  );
};

proto.uploadKey = function(token, key, environment) {
  return this._executeRequest('POST', 'user/keys', environment, token, true,
    {
      form: {
        title: 'availity-cli',
        key: key
      }
    },
    function(response, resolve, reject) {
      var statusCode = response[0].statusCode;
      if (statusCode === 201) {
        resolve(statusCode);
      } else if (statusCode === 404 || statusCode === 400) {
        reject('SSH key already configured');
      } else {
        reject(statusCode);
      }
    },
    function(json, resolve, reject) {
      /* jshint unused: false */
    }
  );
};

proto.createProject = function(token, projectName, environment) {
  return this._executeRequest('POST', 'projects', environment, token, true,
    {
      form: {
        name: projectName
      }
    },
    function(response, resolve, reject) {
      /* jshint unused: false */
      return response[0].body;
    },
    function(json, resolve, reject) {
      if (json['ssh_url_to_repo']) {
        resolve(json['ssh_url_to_repo']);
      } else {
        var message = json['message'];
        if (message === '404 Not Found') {
          reject('You already have a project with that name on Availity');
        } else {
          reject(message);
        }
      }
    }
  );
};

proto.getGroups = function(token, environment) {
  return this._executeRequest('GET', 'groups', environment, token, true,
    {},
    function(response, resolve, reject) {
      /* jshint unused: false */
      return response[0].body;
    },
    function(json, resolve, reject) {
      /* jshint unused: false */
      resolve(json);
    }
  );
};
