const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const eslint = require('gulp-eslint');
const less = require('gulp-less');
const svgSymbols = require('gulp-svg-symbols');
const autoprefixer = require('gulp-autoprefixer');
const rollup = require('rollup');
const pkg = require('./package.json');

const DIST = 'dist';
const IS_PROD = process.env.NODE_ENV === 'production';
const values = {
  'process.env.VERSION': pkg.version,
  'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
};


const rollupOptions = {
  plugins: [
    {
      transform(code, id) {
        if (path.extname(id) !== '.svg') return;
        return `export default ${JSON.stringify(code)};`;
      },
    },
    require('rollup-plugin-babel')({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    require('rollup-plugin-replace')({ values }),
  ],
};

function buildJs() {
  return rollup.rollup(Object.assign({
    input: 'src/index.js',
  }, rollupOptions))
  .then(bundle => bundle.write({
    name: 'H5Player',
    file: `${DIST}/index.js`,
    format: 'umd',
  }))
  .catch(err => {
    log(err.toString());
  });
}

function buildCss() {
  return gulp.src('src/style.less')
  .pipe(less())
  .pipe(autoprefixer())
  .pipe(gulp.dest(DIST));
}

function buildSvg() {
  return gulp.src('src/icons/*.svg')
  .pipe(svgSymbols({
    templates: ['default-svg'],
    slug: name => `h5p-${name}`,
  }))
  .pipe(gulp.dest('src/temp'));
}

function lint() {
  return gulp.src('src/**/*.js')
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
}

function watch() {
  gulp.watch('src/**/*.js', buildJs);
  gulp.watch('src/**/*.less', buildCss);
}

const build = gulp.parallel(gulp.series(buildSvg, buildJs), buildCss);

exports.lint = lint;
exports.build = build;
exports.dev = gulp.series(build, watch);
