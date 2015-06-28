var argv = require('yargs').argv;
var babel = require('gulp-babel')
var del = require('del');
var electron = require('gulp-atom-electron');
var glob = require('glob');
var gulp = require('gulp');
var gulpFilter = require('gulp-filter');
var gutil = require('gulp-util');
var mkdirp = require('mkdirp');
var myth = require('gulp-myth');
var path = require('path');
var plumber = require('gulp-plumber');
var rename = require("gulp-rename");
var shell = require('gulp-shell')
var spawn = require('child_process').spawn;


gulp.task('run', shell.task([
    'node ./node_modules/electron-prebuilt/cli.js ./build',
]));

gulp.task('watch', function() {
    gulp.watch(['lib/**/*', 'static/**/*'], ['build.app', 'build.babelPolyfill']);
});

gulp.task('clean', function(cb) {
    del(['build/**/*', 'package/**/*'], cb);
});

gulp.task('build.app', function() {
    var es6Filter = gulpFilter('**/*.es6');
    var cssFilter = gulpFilter('**/*.css');
    var files = [
        'lib/**/*',
        'static/**/*',
        'package.json',
    ];

    return gulp.src(files, {base: '.'})
        .pipe(plumber())

        .pipe(es6Filter)
        .pipe(babel({
            modules: 'common',
            optional: [
                'es7.asyncFunctions',
            ]
        }))
        .pipe(es6Filter.restore())

        .pipe(cssFilter)
        .pipe(myth())
        .pipe(cssFilter.restore())

        .pipe(gulp.dest('build'));
});

gulp.task('build.babelPolyfill', function() {
    var babelPolyfill = './node_modules/gulp-babel/node_modules/babel-core/browser-polyfill.js';
    return gulp.src(babelPolyfill)
        .pipe(rename('babel-browser-polyfill.js'))
        .pipe(gulp.dest('build/static/js/lib'));
});

/**
 * Compile the C libraries with emscripten.
 */
gulp.task('build.emscripten', function(done) {
    var empp = process.env.EMPP_BIN || argv.empp || 'em++';

    var gme_dir = path.join('src', 'game_music_emu', 'gme');
    var gme_files = glob.sync(gme_dir + '/*.cpp');
    var json_dir = path.join('src', 'json', 'ccan', 'json');
    var json_files = glob.sync(json_dir + '/*.c');
    var source_files = ['src/gme_wrapper.cpp'].concat(gme_files, json_files);
    var outfile = path.join('build', 'static', 'js', 'gme_wrapper.js');

    var flags = [
        '-s', 'ASM_JS=1',
        '-s', 'EXPORTED_FUNCTIONS=@src/exported_functions.json',
        '-O1',
        '-I' + gme_dir,
        '-I' + json_dir,
        '-o',  outfile,
        '-s', 'ASSERTIONS=1',

        // GCC/Clang arguments to shut up about warnings in code I didn't
        // write. :D
        '-Wno-deprecated',
        '-Qunused-arguments',
        '-Wno-logical-op-parentheses'
    ];
    var args = [].concat(flags, source_files);

    gutil.log('Compiling via emscripten to ' + outfile);
    mkdirp.sync(path.join('build', 'static', 'js'));
    var build_proc = spawn(empp, args, {stdio: 'inherit'});
    build_proc.on('exit', function() {
        done();
    });
});

gulp.task('build', ['build.app', 'build.emscripten', 'build.babelPolyfill'])

gulp.task('package.darwin', ['build'], function() {
    return gulp.src('build/**')
        .pipe(electron({
            version: '0.27.1',
            platform: 'darwin',
            darwinIcon: 'resources/mac/icon.icns'
        }))
        .pipe(electron.zfsdest('package/darwin/Moseamp.zip'));
});
