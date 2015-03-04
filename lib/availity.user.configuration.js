var path = require('path');
var fs = require('fs');

var UserConfiguration = function() {
  var homeDirectory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  this.fileName = path.join(homeDirectory, '.availity.config.json');
  this.config = {}; // the contents of the JSON configuration file
  this._load();
};

var proto = UserConfiguration.prototype;

proto._getEnvironment = function(environment) {
  // Search for an existing environment
  for (var i = 0, n = this.config.environments.length; i < n; i++) {
    if (this.config.environments[i].name === environment) {
      return this.config.environments[i];
    }
  }
  // If the requested environment doesn't exist, create it
  var env = { name: environment };
  this.config.environments.push(env);
  return env;
};

proto._load = function() {
  try {
    // Load the JSON file
    this.config = JSON.parse(fs.readFileSync(this.fileName, { encoding: 'utf8' }));
  } catch (err) {
    // Ignore file not found error
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  // Make sure we have something
  this.config = this.config || {};
  this.config.environments = this.config.environments || [];
};

proto._save = function() {
  // Save the JSON file
  fs.writeFileSync(this.fileName, JSON.stringify(this.config, null, 2));
};

proto.getValue = function(key, environment) {
  var value;
  if (environment) {
    value = this._getEnvironment(environment)[key];
  } else {
    value = this.config[key];
  }
  return value || null;
};

proto.setValue = function(key, value, environment) {
  if (environment) {
    this._getEnvironment(environment)[key] = value;
  } else {
    this.config[key] = value;
  }
  this._save();
};

proto.getCredentials = function(environment) {
  var env = this._getEnvironment(environment);
  return this.getValue('token', env.name);
};

proto.setCredentials = function(userId, token, environment) {
  this.setValue('userId', userId, environment);
  this.setValue('token', token, environment);
};

proto.getGroups = function(environment) {
  var env = this._getEnvironment(environment);
  return this.getValue('groups', env.name);
};

proto.setGroups = function(groups, environment) {
  this.setValue('groups', groups, environment);
};

proto.getGroup = function(criterion, environment) {
  if (criterion) {
    var groups = this.getGroups(environment);
    if (groups) {
      for (var i in groups) {
        var group = groups[i];
        if (group.id === criterion || group.name === criterion || group.path === criterion) {
          return group;
        }
      }
    }
  }
  return null;
};

module.exports = new UserConfiguration();
