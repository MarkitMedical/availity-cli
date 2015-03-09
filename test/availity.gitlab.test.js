var nock = require('nock');
var GitLab = require('../lib/availity.gitlab');
var utils = require('../lib/availity.utils');

var gitlab = new GitLab();
describe('gitlab', function() {
  it('should reject for incorrect credentials', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('session'))
    .reply(401, '{ "message" : "401 Unauthorized" }');

    gitlab.login('foo', 'bar', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for correct credentials', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('session'))
    .reply(200, '{ "private_token" : "foo" }');

    gitlab.login('foo', 'bar', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });

  it('should reject for duplicate key', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('user/keys'))
    .reply(404, '');

    gitlab.uploadKey('token', 'key', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should reject for key error', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('user/keys'))
    .reply(500, '');

    gitlab.uploadKey('token', 'key', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for successful key', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('user/keys'))
    .reply(201, '');

    gitlab.uploadKey('token', 'key', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });

  it('should reject for failed project', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('projects'))
    .reply(500, '');

    gitlab.createProject('token', 'foo', 'group', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for successful project', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .post(gitlab._apiUrl('projects'))
    .reply(201, '{ "ssh_url_to_repo" : "git@foo" }');

    gitlab.createProject('token', 'foo', 'group', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });

  it('should reject for failed groups', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .get(gitlab._apiUrl('groups'))
    .reply(500, '');

    gitlab.getGroups('token', utils.environments.TEST).should.be.rejected.and.notify(done);
  });

  it('should resolve for successful groups', function(done) {
    nock(gitlab.hostnames[utils.environments.TEST])
    .filteringRequestBody(/^.*$/g, '')
    .get(gitlab._apiUrl('groups'))
    .reply(200, '[ { "id": 161, "name": "Availity", "path": "availity", "owner_id": null } ]');

    gitlab.getGroups('token', utils.environments.TEST).should.be.fulfilled.and.notify(done);
  });
});
