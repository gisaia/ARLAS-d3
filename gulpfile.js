const gulp = require('gulp');
const flatten = require('gulp-flatten');

function copyScss() {
   return gulp.src('./src/**/**/*.{scss,css}')
        .pipe(flatten())
        .pipe(gulp.dest('./dist/styles'));
}

gulp.task('build:copy-css', copyScss);

gulp.task('default',gulp.series('build:copy-css'));
