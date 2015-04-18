#!node
var gulp = require('gulp');
var concat = require('gulp-concat');
var merge = require('gulp-merge');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var css2js = require('gulp-css2js');
var rename = require('gulp-rename');

gulp.task('build', function() {
	var js = gulp.src('src/*.js')
		.pipe(uglify())
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest('dist/'))
	;
	return merge(
		gulp.src('src/*.less')
			.pipe(less())
			.pipe(minifyCss())
			.pipe(rename({suffix:'.min'}))
			.pipe(gulp.dest('dist/'))
			.pipe(css2js()),
		js
	).pipe(concat('player-with-css.js'))
		.pipe(uglify())
		.pipe(rename({suffix:'.min'}))
		.pipe(gulp.dest('dist/'))
	;
});

gulp.task('default', ['build']);
