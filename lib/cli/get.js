var logger = require('../logger');
var _ = require('lodash');
var utils = require('../availity/utils');
var config = require('../availity/config');

module.exports.set = function(program) {
    program
        .command('get <from> [details...]')
        .description('get from available resources')
        .action(function(from, details) {
            if (from === 'help') {
                _.forEach(getOptions, function(value, key) {
                    console.log('   ' + key + ": " + value.description)
                });
            } else if (getOptions[from]) {
                getOptions[from].get(details);
            }

        });
};


var getOptions = {
    'groups': {
        get: function(details) {
            logger.info('get groups');
            // logger.info(details);
            var id, search, members;

            if (details) {
                // logger.info('yeah details');
                details.forEach(function(val) {
                	if(val.substr(0, 3) == 'id='){
                		id = val.substr(3);
                		// logger.info('id: ' + id);
                	}else if( val.substr(0,7) == 'search='){
                		search = val.substr(7);
                		// logger.info('search: ' + search);
                	}if(val.substr(0,7) == 'members'){
                		members = true;
                		// logger.info('members: ' + members);
                	}
                    // logger.info(val);
                });

            }

            var request = '/groups';
            if(id || search || members){
            	if(search){
            		request += '?search=' + search;
            	}else{
            		if(id){
            			request += '/'+id;
            			if(members){
            				request+= '/members'
            			}
            		}
            	}
            }

            logger.info('request: ' + request);
            if(config.getCredentials()){
            	logger.info('token exists');
            }else{
            	logger.info('no token?');
            }
            // utils.executeRequest('GET', request, config.getCredentials(), true,
            // 	{},
            // 	function(response, resolve, reject){
            // 		return response[0].body;
            // 	},
            // 	function(response, resolve, reject){
            // 		logger.info(response);
            // 		resolve();
            // 	});

        },
        description: 'groups accessable to user'
    }
};
