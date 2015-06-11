var BPromise = require('bluebird');
var request = BPromise.promisifyAll(require('request'));
var logger = require('../logger');

exports.homeDirectory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

exports.prompt = BPromise.promisifyAll(require('prompt'));
exports.prompt.message = '';
exports.prompt.delimiter = '';
exports.prompt.colors = false;

exports.environments = {
    TEST: 'test',
    QA: 'qa',
    PROD: 'prod'
};

exports.hostnames = {
    prod: 'https://code.availity.com',
    qa: 'https://qa-code.availity.com',
    test: 'http://agltstpyg01.availity.net'
};

exports.environmentNames = Object.keys(exports.environments).map(function(key) {
    return exports.environments[key];
});

var _makeUrl = function(path, environment) {
    return exports.hostnames[environment] + '/api/v3/' + path;
};

exports.executeRequest = function(method, resource, token, tokenRequired, data, responseFunction, successFunction) {
    var environemnt = require('./config').getSession('environment');

    return new BPromise(function(resolve, reject) {
        // Add standard data to the request
        // Add the token if the call requires it
        if (tokenRequired) {
            if (token === null) {
                // If this call requires a token, and you didn't pass one, don't bother to make the call
                reject('You are not logged in to ' + environemnt);
            } else {
                data['headers'] = {};
                data['headers']['PRIVATE-TOKEN'] = token;
            }
        }
        // The non-prod certs are self-signed, so enforce trusted certs only in Prod
        data['strictSSL'] = environemnt === 'prod';

        // Right now, we use only POST or GET, so get the right method
        request.method = method.toUpperCase() === 'POST' ?
            request.postAsync :
            request.getAsync;

        // Make the request to the GitLab server
        request.method(_makeUrl(resource, environemnt), data)
            .then(function(response) {
                // response contains the response from the GitLab server
                // Call the response function passed in. For GitLab requests
                // that return a status code but no payload, this will resolve
                // or reject here
                return responseFunction(response, resolve, reject);
            })
            .then(function(json){
                return JSON.parse(json);
            })
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

exports.onError= function(err){
	logger.error(err);
	process.exit(1);
};
