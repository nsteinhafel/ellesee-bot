var gulp = require('gulp'),
    del = require('del'),
    exec = require('child_process').exec;

gulp.task('clean', () => {
    // Kill everything in lib.
    return del([ 'lib/**/*' ]);
});

gulp.task('tsc', (done) => {
    // Run the typescript compiler.
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
    // Copy all of our json files to lib.
    return gulp.src('src/**/*.json')
        .pipe(gulp.dest('lib'));
});

gulp.task('default', ['clean', 'tsc', 'copyJson']);
