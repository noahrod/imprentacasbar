var gulp = require('gulp');
var sass = require('gulp-sass')(require('sass'));
var browserSync = require('browser-sync').create();

// Configure Sass to use modern API
const sassOptions = {
  api: 'modern-compiler',
  silenceDeprecations: ['legacy-js-api', 'import']
};
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var filter = require('gulp-filter');
var pkg = require('./package.json');

// Set the banner content
var banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  ''
].join('');

// Compiles SCSS files from /scss into /css
function sassTask() {
  return gulp.src('scss/freelancer.scss')
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest('css'))
    .pipe(browserSync.reload({
      stream: true
    }))
}

// Minify compiled CSS
function minifyCssTask() {
  return gulp.src('css/freelancer.css')
    .pipe(cleanCSS({
      compatibility: 'ie8'
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('css'))
    .pipe(browserSync.reload({
      stream: true
    }))
}

// Minify custom JS
function minifyJsTask() {
  return gulp.src('js/freelancer.js')
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('js'))
    .pipe(browserSync.reload({
      stream: true
    }))
}

// Copy vendor files from /node_modules into /vendor
// NOTE: requires `npm install` before running!
function copyTask(done) {
  gulp.src([
      'node_modules/bootstrap/dist/**/*',
      '!**/npm.js',
      '!**/bootstrap-theme.*',
      '!**/*.map'
    ])
    .pipe(gulp.dest('vendor/bootstrap'))

  gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
    .pipe(gulp.dest('vendor/jquery'))

  gulp.src(['node_modules/jquery.easing/*.js'])
    .pipe(gulp.dest('vendor/jquery-easing'))

  gulp.src(['node_modules/magnific-popup/dist/*'])
    .pipe(gulp.dest('vendor/magnific-popup'))

  gulp.src([
      'node_modules/font-awesome/**',
      '!node_modules/font-awesome/**/*.map',
      '!node_modules/font-awesome/.npmignore',
      '!node_modules/font-awesome/*.txt',
      '!node_modules/font-awesome/*.md',
      '!node_modules/font-awesome/*.json'
    ])
    .pipe(gulp.dest('vendor/font-awesome'))
  
  done();
}

// Configure the browserSync task
function browserSyncTask(done) {
  browserSync.init({
    server: {
      baseDir: ''
    },
  })
  done();
}

// Watch files
function watchFiles() {
  gulp.watch('scss/*.scss', gulp.series(sassTask, minifyCssTask));
  gulp.watch('css/*.css', minifyCssTask);
  gulp.watch('js/*.js', minifyJsTask);
  gulp.watch('*.html', browserSync.reload);
  gulp.watch('js/**/*.js', browserSync.reload);
}

// Define complex tasks
const css = gulp.series(sassTask, minifyCssTask);
const build = gulp.parallel(css, minifyJsTask, copyTask);
const dev = gulp.series(browserSyncTask, build, watchFiles);

// Export tasks
exports.sass = sassTask;
exports.css = css;
exports['minify-css'] = minifyCssTask;
exports['minify-js'] = minifyJsTask;
exports.copy = copyTask;
exports.browserSync = browserSyncTask;
exports.watch = watchFiles;
exports.dev = dev;
exports.default = build;
