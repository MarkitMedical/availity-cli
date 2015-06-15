var utils = require('./utils');

var GitLab = module.exports = function() {};

var proto = GitLab.prototype;

proto.login = function(userId, password) {
    return utils.executeRequest('POST', 'session', null, false, {
            form: {
                login: userId,
                password: password
            }
        },
        function(response, resolve, reject) {
            return response[0].body;
        },
        function(json, resolve, reject) {
            if (json['private_token']) {
                resolve(json['private_token']);
            } else {
                reject(json['message']);
            }
        }
    );
};

proto.uploadKey = function(token, key){
	return utils.executeRequest('POST', 'user/keys', token, true,
	{
		form: {
			title: 'availity-cli',
			key: key
		}
	},
	function(response, resolve, reject) {
		var statusCode = response[0].statusCode;
		if(statusCode === 201){
			resolve(statusCode);
		}else if(statusCode === 404 || statusCode === 400){
			reject('SSH key already configured');
		}else {
			reject('statusCode');
		}
	},
	function(json, resolve, reject){
		//jshint unused; false
	});
};


proto.createProject = function(token, group, projectName) {
  var data = {
    form: {
      name: projectName
    }
  };
  if (group !== null && group !== undefined) {
    data['form']['namespace_id'] = group.id;
  }
  return utils.executeRequest('POST', 'projects', token, true, data,
    function(response, resolve, reject) {
      /* jshint unused: false */
      return response[0].body;
    },
    function(json, resolve, reject) {
      if (json['ssh_url_to_repo']) {
        resolve(json['ssh_url_to_repo']);
      } else {
        var message = json['message'];
        if (message === '404 Not Found') {
          reject('You already have a project with that name on Availity');
        } else {
          reject(message);
        }
      }
    }
  );
};

proto.getGroups = function(token, id, search, members) {
  var resource = 'groups';
  if(id){
    resource += '/'+id;
    if(members){
      resource += '/'+members;
    }
  }else if(search){
    resource += '?search=' + search;
  }
  return utils.executeRequest('GET', resource, token, true,
    {},
    function(response, resolve, reject) {
      /* jshint unused: false */
      return response[0].body;
    },
    function(json, resolve, reject) {
      /* jshint unused: false */
      resolve(json);
    }
  );
};

