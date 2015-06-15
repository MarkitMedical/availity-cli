var project = require('../availity.project');

module.exports.set = function(program){
	program.command('init [name]')
		.description('initialize a project in directory [name] or CWD')
		.action(function(name){
			project.init(name);
		});

	program.command('create')
	.description('create the current project on the Availity server')
	.action(function() {
		project.create(program.group);
	});
}