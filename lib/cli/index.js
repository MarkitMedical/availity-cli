var program = require('commander');
var logger = require('../logger');
var pjson = require('../../package.json');
var config = require('../availity/config');
var utils = require('../availity/utils');

var user = require('./user');
var health = require('./health');

var validEnv = function(val) {
    val = val || utils.environments.PROD;
    if (utils.environmentNames.indexOf(val) === -1) {
        logger.error('enviornment must be one of ' + utils.environmentNames.join(', '));
        process.exit(1);
    }
    config.setThisSession('environment', val);
    return val;
}

var validVerbose = function(val){
	if(val < 0 || val > 4){
		logger.error('verbose level must be between 0 and 4');
		process.exit(1);
	}
	config.setThisSession('verbose', val);
	logger.setLevel(val);
	return val;
}

var exitHandler = function() {
    process.exit();
}

process.on('exit', exitHandler.bind(null));
process.on('SIGINT', exitHandler.bind(null));

program
    .version(pjson.version)
    .option('-e, --environment [value]',
        'Use this environment to use [' + utils.environmentNames.join('|') + ']',
        validEnv)
    .option('-g, --group [value]', 'The name of the group to use')
    .option('-v, --verbose [value]', 'Use this verbose level (between 0 and 4)', validVerbose)
    .usage('[options] <command>');

//do the commands here
program.command('set <var> <val>')
	.description('set perminant variables')
	.action(function(sesssionVar, val){
		if(sesssionVar === 'environment' || sesssionVar === 'env'){
			if(utils.environmentNames.indexOf(val) === -1){
        		logger.error('enviornment must be one of ' + utils.environmentNames.join(', '));
			}else{
				config.setSession('environment', val);
			}
		} else if(sesssionVar === 'verbose'){
			verboseLevel = parseInt(val); 
			if(verboseLevel < 0 || verboseLevel > 4){
				logger.error('verbose level must be between 0 and 4');
			}else{
				config.setSession('verbose', verboseLevel);
			}
		}else{
			logger.error('can only set environment and verbose');
		}
	}).on('--help', function(){
		console.log('  Can set the stored environment and verbose values');
		console.log('  Examples: ');
		console.log('      $ availity set verbose 3');
		console.log('      $ availity set environment qa');
		console.log('      $ availity set env prod');
		console.log();
	});

user.set(program);
health.set(program);

program.parse(process.argv);

if (!program.args.length) {
    program.help();
}
