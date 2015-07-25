var electron = require('gulp-atom-electron');
var gulp = require('gulp');
var shell = require('gulp-shell');


gulp.task('run', shell.task([
    'node ./node_modules/electron-prebuilt/cli.js ./',
]));

gulp.task('package.darwin', function() {
    var files = [
        'src/**/*',
        'static/**/*',
        'dot-moseamp/**/*',
        'package.json'
    ];

    return gulp.src(files, {base: '.'})
        .pipe(electron({
            version: '0.30.1',
            platform: 'darwin',
            darwinIcon: 'resources/mac/icon.icns'
        }))
        .pipe(electron.zfsdest('package/darwin/Moseamp.zip'));
});
