var gulp = require('gulp')
, uglify = require("gulp-uglify")
,gulpLivereload = require('gulp-livereload');  // 載入 gulp-livereload;
var pump = require('pump'); 
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var iife = require("gulp-iife");

gulp.task('watch', function () {
    gulpLivereload.listen();
    gulp.watch('../public/app/**/*.js', ['minify-angular-app-js','concat-angular-app-scripts']);
});

gulp.task('minify-angular-app-js', function (cb) {
  pump([
      gulp.src('../public/app/**/*.js'),
      iife(),
      uglify(),
      gulp.dest('../public/app-min')
    ],
    cb
  );
});

gulp.task('concat-angular-app-scripts', function(cb) {
  pump([
      gulp.src('../public/app-min/**/*.js'),
      //sourcemaps.init(),
      concat('whole-app.js'),
      //sourcemaps.write(),
      gulp.dest('../public/app-dist/')
    ],
    cb);
});

gulp.task('concatLib', function(cb){
  var libPrefx = '../public/js/'
  var libSrcs = ([
    'jquery/jquery-1.11.3.min.js',
    'jquery/jquery.form.min.js',
    
    'bootstrap/bootstrap-3.3.5.min.js',
    'bootstrap/validator.min.js',
    
    'lodash/lodash.min.js',

    'angular/angular.min.js', 
    'angular/angular-ui-router.min.js',
    'angular/angular-filter.min.js'
    ]).map(function(path) {
    return libPrefx + path;
  });

  return pump([gulp.src(libSrcs),
    concat('all-lib.js'),
    gulp.dest('../public/js/')],
    cb
  );
});

//compose build task