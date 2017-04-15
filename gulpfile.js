var gulp = require('gulp'),
    exec = require('child_process').exec;

gulp.task('tsc', (done) => {
    exec('tsc', (err, stdOut, stdErr) => {
        console.log(stdOut);
        if (err){
            done(err);
        } else {
            done();
        }
    });
});

gulp.task('copyJson', () => {
    return gulp.src('src/**/*.json')
        .pipe(gulp.dest('lib'));
});

gulp.task('default', ['tsc', 'copyJson']);