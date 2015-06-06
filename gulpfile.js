var del = require('del');
var gulp = require('gulp');
var babel = require('gulp-babel');
var shell = require('gulp-shell')


gulp.task('run', shell.task([
    'node ./node_modules/electron-prebuilt/cli.js ./build',
]));

gulp.task('watch', function() {
    gulp.watch(['lib/**/*', 'static/**/*'], ['build']);
});

gulp.task('clean', function(cb) {
    del('build/**/*', cb);
});

gulp.task('build.js', function() {
    return gulp.src('lib/**/*.es6')
        .pipe(babel())
        .pipe(gulp.dest('build/lib'));
});

gulp.task('build.static', function() {
    return gulp.src('static/**/*', {base: '.'})
        .pipe(gulp.dest('build'));
});

gulp.task('build.package.json', function() {
    return gulp.src('package.json')
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['build.js', 'build.static', 'build.package.json']);
