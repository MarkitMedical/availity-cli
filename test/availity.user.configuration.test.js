var path = require('path');
var FS = require('fs-mock');
var rewire = require('rewire');
var userConfiguration = rewire('../lib/availity.user.configuration');

var homeDirectory = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var properties = {};
properties[path.join(homeDirectory, '.availity.config.json')] = JSON.stringify({
  'environments': [
    {
      'name': 'test',
      'userId': 'testUserId'
    },
    {
      'name': 'qa',
      'userId': 'qaUserId',
      'groups': [
        {
          'id': 100,
          'name': 'Your Group',
          'path': 'your-group'
        },
        {
          'id': 123,
          'name': 'My Group',
          'path': 'my-group'
        },
        {
          'id': 150,
          'name': 'Another',
          'path': 'another'
        }
      ]
    },
    {
      'name': 'prod',
      'userId': 'prodUserId'
    }
  ]
});
userConfiguration.__set__('fs', new FS(properties));
userConfiguration._load(); // Now that we've mocked the fs, reload

describe('user configuration', function() {
  it('should have 3 environments', function() {
    userConfiguration.getValue('environments').length.should.equal(3);
  });

  it('should have user ID for test', function() {
    userConfiguration.getValue('userId', 'test').should.equal('testUserId');
  });

  it('should have user ID for qa', function() {
    userConfiguration.getValue('userId', 'qa').should.equal('qaUserId');
  });

  it('should have user ID for prod', function() {
    userConfiguration.getValue('userId', 'prod').should.equal('prodUserId');
  });

  it('should set a top-level setValue', function() {
    userConfiguration.setValue('foo', 'bar');
    userConfiguration.getValue('foo').should.equals('bar');
  });

  it('should set an environmental setValue', function() {
    userConfiguration.setValue('userId', 'newUserId', 'test');
    userConfiguration.getValue('userId', 'test').should.equal('newUserId');
  });

  it('should store token', function() {
    userConfiguration.setCredentials('my_user_id', 'my_token', 'test');
    userConfiguration.getCredentials('test').should.equal('my_token');
  });

  it('should return null for token when not logged in', function() {
    var should = require('chai').should();
    should.equal(userConfiguration.getCredentials('qa'), null);
  });

  it('should return null for non-existent group', function() {
    var should = require('chai').should();
    should.equal(userConfiguration.getGroup('not-here', 'qa'), null);
  });

  it('should return group for get by ID', function() {
    userConfiguration.getGroup(123, 'qa').name.should.equals('My Group');
  });

  it('should return group for get by name', function() {
    userConfiguration.getGroup('My Group', 'qa').name.should.equals('My Group');
  });
  it('should return group for get by path', function() {
    userConfiguration.getGroup('my-group', 'qa').name.should.equals('My Group');
  });
});
