var gulp = require('gulp');
var config = require('../config');
require('availity-limo')(gulp, config);

gulp.task('default', ['test']);
