var User = require('../availity/user');

module.exports.set = function(program) {

    program
        .command('login')
        .description('log in with your Availity develop credentials')
        .action(function() {
            //log in
            new User().login();
        });

    // program
    //     .command('groups')
    //     .description('display the groups you belong to on the Availity server')
    //     .action(function() {
    //         //get groups
    //         new User().login(getGroups(program.environment));
    //     });

    //list projects

}