var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var logger = require('../logger');
var utils = require('./utils');

var config = function() {
    this.fileName = path.join(utils.homeDirectory, '.'+this.configurationFile);
    this._load();
    logger.setLevel(this.getSession('verbose'));
}

var proto = config.prototype;

proto.configurationFile = 'availity.config.json';

proto._load = function() {
    this.config = this._loadFromFile() || {};
    this.config.session = this.config.session || {
        verbose: 4,
        environment: 'prod',
        group: null
    };
    this.session = _.cloneDeep(this.config.session);
    this.config.environments = this.config.envrionments || [];
};

proto._save = function() {
    //save JSON file
    fs.writeFileSync(this.fileName, JSON.stringify(this.config, null, 2));
};

proto._loadFromFile = function() {
    try {
        //load the Json File
        return JSON.parse(fs.readFileSync(this.fileName, {
            encoding: 'utf8'
        }));
    } catch (err) {
        //Ignore file not foud error
        if (err.code !== 'ENOENT') {
            utils.onError(err);
        }
    }
    return null;
};

proto._getEnvironment = function() {
    var env = this.session.environment;
    if (!this.config.environments[env]) {
        this.config.environments[env] = {};
    }
    this._save();
    return this.config.environments[env];
};

proto.getSession = function(key) {
    return this.session[key] || null;
};

proto.setSession = function(key, value) {
    this.config.session[key] = value;
    this.session[key] = value;
    this._save();
};

proto.setThisSession = function(key, value) {
    this.session[key] = value;
}

proto.getValue = function(key) {
    return this._getEnvironment()[key] || null;
};

proto.setValue = function(key, value) {
    this._getEnvironment()[key] = value;
    this._save();
};

proto.getCredentials = function() {
    return this.getValue('token');
};

proto.setCredentials = function(userId, token) {
    this.setValue('userId', userId);
    this.setValue('token', token);
};

module.exports = new config();
