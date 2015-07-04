#!node
var gulp = require('gulp');
var concat = require('gulp-concat');
var merge2 = require('merge2');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var css2js = require('gulp-css2js');
var rename = require('gulp-rename');
var wrap = require('gulp-wrap');
var clone = require('gulp-clone');
var header = require('gulp-header');
var pkg = require('./package.json');
var banner = [
	'/**',
	' * <%= pkg.title %> - <%= pkg.description %>',
	' * @version v<%= pkg.version %>',
	' * @license <%= pkg.license %>',
	' * @author <%= pkg.author %>',
	' */',
	'',
].join('\n');
var assets_js;
var assets_css;

gulp.task('build-js', function () {
  var stream = gulp.src('src/*.js')
    .pipe(concat('player.js'))
    .pipe(wrap('(function(){\n<%=contents%>\n}).call({});'))
    .pipe(uglify())
    .pipe(header(banner, {pkg: pkg}))
    .pipe(rename({suffix:'.min'}));
  assets_js = stream.pipe(clone());
  return stream.pipe(gulp.dest('dist/'))
});

gulp.task('build-css', function () {
  var stream = gulp.src('src/*.less')
    .pipe(concat('player.less'))
    .pipe(less())
    .pipe(minifyCss())
    .pipe(rename({suffix:'.min'}));
  assets_css = stream.pipe(clone());
  return stream.pipe(gulp.dest('dist/'));
});

gulp.task('build', ['build-js', 'build-css'], function() {
	return merge2(assets_css.pipe(css2js()), assets_js)
    .pipe(concat('player-with-css.js'))
		.pipe(uglify())
		.pipe(header(banner, {pkg: pkg}))
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest('dist/'));
});

gulp.task('default', ['build']);
