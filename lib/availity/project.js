var util = require('./utils');
var config = require('./config');
var fs = require('fs-extra');
var rp = require('request-promise');
var ProgressBar = require('progress');

var toolkitUrl = 'https://github.com/Availity/availity-toolkit/archive/master.zip';
var projectDirectoryError = process.cwd() + ' is not an Availity project directory';

var createProjectDirectory = function(projectName) {
    if (!fs.existsSync(projectName)) {
        logger.info('Creating directory ' + projectName);
        try {
            mkdirp.sync(projectName);
        } catch (err) {
            onError('Failed to create directory ' + projectName);
        }
    }
};

var saveConfiguration = function(name, parameters) {
    logger.info('Saving configuration');
    try {
        fs.writeFileSync(name + '/' + config.configurationFile, JSON.stringify(parameters, null, 2));
    } catch (err) {
        console.log('err', err);
        onError('Failed to create configuration file: ' + err);
    }
};

var configuration = function() {
    try {
        return JSON.parse(fs.readFileSync(utils.projectConfigurationFile, {
            encoding: 'utf8'
        }));
    } catch (err) {
        onError(err);
    }
};

var currentDirectoryName = function() {
    return process.cwd().split('/').pop();
};

var currentDirectoryIsAvailityProject = function() {
    return fs.existsSync(config.configurationFile);
};

var currentDirectoryIsGitProject = function() {
    return fs.existsSync('./.git/config');
};

var initializeGitProject = function() {
    try {
        exec('git', ['init']);
        return true;
    } catch (err) {
        return false;
    }
};

var switchDirectory = function(newDirectory) {
    return new BPromise(function(resolve, reject) {
        try {
            process.chdir(newDirectory);
            resolve();
        } catch (err) {
            reject(logger.error('chdir: ' + err));
        }
    });
};

var downloadToolkit = function(path, url) {
    return new BPromise(function(resolve, reject) {
        var req = rp({
            uri: url,
            strictSSL: false
        });
        req
            .pipe(fs.createWriteStream(path + '/toolkit.zip'));
        req.finally(function() {
            resolve();
        }).catch(function(err) {
            console.log('download error: ', err);
            reject(onError('Failed to download toolkit: ' + err));
        });
    });
};


var unzipFile = function(readPath, writePath) {
    return new BPromise(function(resolve) {
        var fileSize;
        var zipbar;

        var zipfile = fs.createReadStream(readPath);
        zipfile
            .on('data', function(chunk) {
                fs.stat(zipfile.path, function(error, stat) {
                    if (error) {
                        throw error;
                    }
                    fileSize = stat.size;
                    zipbar = zipbar || new ProgressBar(logger.infoString('Installing Toolkit... [:bar] :percent :etas'), {
                        complete: '=',
                        incomplete: ' ',
                        width: 25,
                        total: parseInt(fileSize)
                    });
                    zipbar.tick(chunk.length);
                });
            })
            .pipe(unzip.Extract({
                path: writePath
            }))
            .on('close', function(err) {
                if (err) {
                    throw err;
                }
                zipbar.tick(zipbar.total - zipbar.curr);
                resolve();
            });
    });
};

var popTopDir = function(readPath, writePath) {
    return new BPromise(function(resolve, reject) {
        var sourcePath = writePath + '/availity-toolkit-master';
        fs.readdir(sourcePath, function(err, list) {
            list.forEach(function(file) {
                fs.move(sourcePath + '/' + file, writePath + '/' + file, function(err) {
                    if (err) {
                        reject(logger.error('Error moving toolkit files: ' + err));
                    }
                });
                fs.remove(readPath);
                fs.remove(sourcePath);
                resolve();
            });
        });
    });
};

var npmInstall = function() {
    return new BPromise(function(resolve, reject) {
        logger.info('Installing packages...');
        var npmOptions = {
            color: 'always'
        };
        logger.mute(); // Mute stdout so we don't show the tree of installed packages
        npm.load(npmOptions, function(err) {
            // catch errors
            if (err) {
                logger.unmute();
                reject(logger.error('NPM load error: ' + err));
            }
            npm.commands.install([], function(er) {
                logger.unmute();
                // log the error or data
                if (er) {
                    reject(logger.error('NPM install error: ' + er));
                }
                resolve(logger.info('Package installation complete'));
            });
        });
    });
};


var installToolkit = function(name, wantsToolkit) {
    return new BPromise(function(resolve) {
        if (wantsToolkit) {
            var writePath = path.normalize(process.cwd() + '/' + name);
            var readPath = writePath + '/toolkit.zip';
            downloadToolkit(writePath, toolkitUrl)
                .then(function() {
                    return unzipFile(readPath, writePath);
                })
                .then(function() {
                    return popTopDir(readPath, writePath);
                })
                .then(function() {
                    return switchDirectory(writePath);
                })
                .then(function() {
                    return npmInstall();
                })
                .then(function() {
                    resolve();
                });
        } else {
            resolve();
        }
    });
};

var applicationInitialized = function(name, toolkitInstalled) {
    return new BPromise(function(resolve) {
        logger.success('Project ' + name + ' initialized');
        logger.success('Next Steps:');
        if (toolkitInstalled) {
            logger.success('* Read the documentation for the Availity Toolkit (https://github.com/Availity/availity-toolkit)');
        } else {
            logger.success('* Install Availity UIKit using instructions for your package manager:');
            logger.success('    NPM:   npm install --save availity-uikit');
            logger.success('    Bower: bower install --save availity-uikit');
            logger.success('    None:  git submodule add git@github.com:Availity/availity-uikit.git');
        }
        logger.success('* Develop your application');
        logger.success('* Use availity create to begin deploying your application');
        resolve();
    });
};

exports.initApplication = function(name, parameters) {
    parameters['name'] = name === '.' ? currentDirectoryName() : name;
    logger.info('\nCreating project ' + parameters['name']);
    createProjectDirectory(name);
    saveConfiguration(name, parameters);

    var wantsToolkit = parameters['toolkit'];
    installToolkit(name, wantsToolkit)
        .then(function() {
            return applicationInitialized(name, wantsToolkit);
        });
};

var getGroupForProject = function(groups) {
    return new BPromise(function(resolve, reject) {
            if (!groups || groups.length === 0) {
                resolve(null);
            } else {
                var menu = ['Yourself'].concat(_.map(groups, 'name'));
                var keyedMenu = [];
                _.forEach(menu, function(item, index) {
                    keyedMenu.push((index + 1) + '. ' + item);
                });

                var properties = [{
                    name: 'group',
                    description: ('Who will own the project?\n' + keyedMenu.join('\n') + '\n==>').yellow,
                    type: 'number',
                    minimum: 1,
                    maximum: keyedMenu.length,
                    message: ('Please enter a number from 1 to ' + keyedMenu.length).red,
                    required: true
                }];
                var prompt = utils.prompt;
                prompt.start();
                prompt.get(properties, function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        // If they chose 'Yourself,' pass null, else pass the appropriate
                        // name from menu
                        if (result.group > 1) {
                            resolve(groups[result.group - 1]);
                        } else {
                            resolve null;
                        }
                    }
                });
            } else {
                resolve(userConfiguration.getGroup(criterion, environment));
            }
        }
    });
};

exports.create = function(groupCriterion) {
    // Make sure this is an Availity project
    if (!currentDirectoryIsAvailityProject()) {
        logger.error(projectDirectoryError);
    } else {
        if (currentDirectoryIsGitProject() || initializeGitProject()) {
            var gitlab = new GitLab();
            var token = config.getCredentials();

            // Refresh the groups for this user
            gitlab.getGroups(token, null, groupCriterion, null).then(function(groups) {

                    // If they have no groups, they're creating as themselves
                    if (groups === null) {
                        return BPromise.resolve(undefined);
                    } else if (groups.length >= = 1) {
                        //multiple groups, use selector
                        return getGroupForProject(groups);
                    } else {
                        //one group
                        BPromise.resolve(groups[0]);
                    }
                })
                .then(function(group) {
                    return gitlab.createProject(config.getCredentials(),
                        group,
                        configuration().name,
                        environment);
                })
                .then(function(remoteUrl) {
                    try {
                        exec('git', ['remote', 'add', 'availity', remoteUrl]);
                        logger.success('Created project on Availity deployment server');
                    } catch (err) {
                        onError('Failed to add Git remote. Please run:\n  git remote add availity ' + remoteUrl);
                    }
                })
                .catch(function(err) {
                    var message = '\n';
                    if (typeof err === 'string') {
                        message += err + '\n';
                    } else {
                        for (var key in err) {
                            message += key + ' ' + err[key] + '\n';
                        }
                    }
                    onError('Cannot create project on Availity server: ' + message);
                });
        } else {
            onError('Cannot initialize project as a Git repository');
        }
    }
};

exports.init = function(name) {
    var properties = [{
        name: 'description',
        description: 'Enter a description for your application:'.yellow,
        type: 'string',
        required: true
    }, {
        name: 'version',
        description: 'Enter the version of your application:'.yellow,
        message: 'Version must be only numbers'.red,
        type: 'string',
        pattern: /^\d{1,2}\.\d{1,2}\.\d{1,2}$/,
        default: '0.1.0',
        required: true
    }, {
        name: 'toolkit',
        message: 'Use our Developer Toolkit?'.yellow,
        warning: 'Must respond yes or no',
        type: 'string',
        validator: /y[es]*|n[o]?/,
        required: true,
        before: function(value) {
            return (value === 'yes' || value === 'y');
        }
    }];

    // If name is blank, use the current directory.
    if (!name || name.length === 0) {
        name = '.';
    }
    var prompt = utils.prompt;
    prompt.start();
    prompt.get(properties, function(err, result) {
        exports.initApplication(name, result);
    });
};
