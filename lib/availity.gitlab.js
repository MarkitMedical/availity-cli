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
    // Add the token if the call requires it
    if (tokenRequired) {
      if (token === null) {
        // If this call requires a token, and you didn't pass one, don't bother to make the call
        reject('You are not logged in to ' + environment);
      } else {
        data['headers'] = {};
        data['headers']['PRIVATE-TOKEN'] = token;
      }
    }
    // The non-prod certs are self-signed, so enforce trusted certs only in Prod
    data['strictSSL'] = environment === 'prod';

    // Right now, we use only POST or GET, so get the right method
    var requestMethod = method.toUpperCase() === 'POST' ?
      request.postAsync :
      request.getAsync;

    // Make the request to the GitLab server
    requestMethod(self._makeUrl(resource, environment), data)
    .then(function(response) {
      // response contains the response from the GitLab server
      // Call the response function passed in. For GitLab requests
      // that return a status code but no payload, this will resolve
      // or reject here
      return responseFunction(response, resolve, reject);
    })
    .then(JSON.parse)
    .then(function(json) {
      // We now have the JSON payload returned from GitLab
      // Call the success function, which should resolve or reject
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

proto.createProject = function(token, group, projectName, environment) {
  var data = {
    form: {
      name: projectName
    }
  };
  if (group !== null) {
    data['form']['namespace_id'] = group.id;
  }
  return this._executeRequest('POST', 'projects', environment, token, true, data,
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
