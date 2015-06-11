var health = require('../availity/health');

module.exports.set = function(program) {

    program
        .command('doctor')
        .description('perform health check for availity CLI')
        .action(function() {
            var healthy = health.isHealthy();
            if (!healthy) {
                logger.error('Please correct problems before trying again');
            }
            return healthy;
        });

}
