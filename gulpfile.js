var argv = require('yargs').argv;
var babel = require('gulp-babel')
var del = require('del');
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
    del('build/**/*', cb);
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
    var emcc = process.env.EMCC_BIN || argv.emcc || 'emcc';

    var gme_dir = path.join('src', 'game_music_emu', 'gme');
    var gme_files = glob.sync(gme_dir + '/*.cpp');
    var source_files = ['src/gme_wrapper.c'].concat(gme_files);
    var outfile = path.join('build', 'static', 'js', 'gme_wrapper.js');

    var flags = [
        '-s', 'ASM_JS=1',
        '-s', 'EXPORTED_FUNCTIONS=@src/exported_functions.json',
        '-O1',
        '-I' + gme_dir,
        '-o',  outfile,

        // GCC/Clang arguments to shut up about warnings in code I didn't
        // write. :D
        '-Wno-deprecated',
        '-Qunused-arguments',
        '-Wno-logical-op-parentheses'
    ];
    var args = [].concat(flags, source_files);

    gutil.log('Compiling via emscripten to ' + outfile);
    mkdirp.sync(path.join('build', 'static', 'js'));
    var build_proc = spawn(emcc, args, {stdio: 'inherit'});
    build_proc.on('exit', function() {
        done();
    });
});

gulp.task('build', ['build.app', 'build.emscripten', 'build.babelPolyfill'])
