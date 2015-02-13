var nock = require('nock');
var gitlab = require('../lib/availity.gitlab');
var utils = require('../lib/availity.utils');

describe('gitlab', function() {
  it('should reject for incorrect credentials', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('session'))
    .reply(401, '{ "message" : "401 Unauthorized" }');

    gitlab.login('foo', 'bar', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for correct credentials', function(done) {
    console.log('url: ' + gitlab.hostnames[utils.environments.TEST]);
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('session'))
    .reply(200, '{ "private_token" : "foo" }');

    gitlab.login('foo', 'bar', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });

  it('should reject for duplicate key', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('user/keys'))
    .reply(404, '');

    gitlab.uploadKey('token', 'key', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should reject for key error', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('user/keys'))
    .reply(500, '');

    gitlab.uploadKey('token', 'key', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for successful key', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('user/keys'))
    .reply(201, '');

    gitlab.uploadKey('token', 'key', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });

  it('should reject for failed project', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('projects'))
    .reply(500, '');

    gitlab.createProject('token', 'foo', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for successful project', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab.apiUrl('projects'))
    .reply(201, '{ "ssh_url_to_repo" : "git@foo" }');

    gitlab.createProject('token', 'foo', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });
});
