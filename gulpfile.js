const gulp = require('gulp');
const concat = require('gulp-concat');
const merge2 = require('merge2');
const uglify = require('gulp-uglify');
const less = require('gulp-less');
const PluginCleanCss = require('less-plugin-clean-css');
const PluginAutoPrefix = require('less-plugin-autoprefix');
const cleanCss = new PluginCleanCss({advanced: true});
const autoPrefix = new PluginAutoPrefix();
const css2js = require('gulp-css2js');
const rename = require('gulp-rename');
const wrap = require('gulp-wrap');
const header = require('gulp-header');
const pkg = require('./package.json');
const banner = [
  '/**',
  ' * <%= pkg.title %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @license <%= pkg.license %>',
  ' * @author <%= pkg.author %>',
  ' */',
  '',
].join('\n');

gulp.task('build', () => (
  merge2([
    gulp.src('src/*.js'),
    gulp.src('src/*.less')
    .pipe(concat('player.less'))
    .pipe(less({
      plugins: [cleanCss, autoPrefix],
    }))
    .pipe(css2js()),
  ])
  .pipe(concat('player.js'))
  .pipe(wrap('!function(){\n<%=contents%>\n}();'))
  .pipe(header(banner, {pkg: pkg}))
  .pipe(gulp.dest('dist'))
  .pipe(uglify())
  .pipe(rename({suffix: '.min'}))
  .pipe(gulp.dest('dist'))
));

gulp.task('default', ['build']);
