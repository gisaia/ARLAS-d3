const gulp = require('gulp');
const gulpRunSequence = require('run-sequence');
const flatten = require('gulp-flatten');
const PROJECT_ROOT = process.cwd();


function copyScss() {
    gulp.src('./src/**/**/*.{scss,css}')
        .pipe(flatten())
        .pipe(gulp.dest('./dist/styles'));
}

gulp.task('build:copy-css', copyScss);
gulp.task('build:release', function (done) {
    return gulpRunSequence(
        'build:copy-css',
        done
    );
});

gulp.task('default',['build:release']);
