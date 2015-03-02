var project = require('../lib/availity.project');
var fs = require('fs-extra');
var path = require('path');
var rimraf = require('rimraf');
var path = require('path');

describe('project', function() {
  var testParameters = {
    name: 'testProject',
    description: 'This is a really cool project',
    toolkitVersion: '1.2.3',
    version: '0.9.1',
    minimumIE: 11,
    linkoutURL: 'http://example.com/'
  };

  beforeEach(function() {
    if (fs.existsSync(testParameters.name)) {
      rimraf.sync(testParameters.name);
    }
  });

  afterEach(function() {
    if (fs.existsSync(testParameters.name)) {
      rimraf.sync(testParameters.name);
    }
  });

  it('should be initialized when create is called', function() {
    project.initApplication(testParameters.name, testParameters);
    fs.existsSync(testParameters.name).should.be.ok;
    fs.existsSync(testParameters.name + '/availity.config.json').should.be.ok;

    var data = fs.readFileSync(testParameters.name + '/availity.config.json', 'utf8');
    data.should.not.be.null;

    var config = JSON.parse(data);
    config.name.should.equal('testProject');
    config.description.should.equal('This is a really cool project');
    config.version.should.equal('0.9.1');
    config.toolkitVersion.should.equal('1.2.3');
    config.minimumIE.should.equal(11);
    config.linkoutURL.should.equal('http://example.com/');
  });

  it('should unzip a file',function(){
    this.timeout(5000);
    var writePath = path.normalize(process.cwd());
    var readPath = writePath + '/testProject.zip';
    project.unzipFile(readPath, writePath);
    fs.existsSync(testParameters.name).should.be.ok;
  });

});
