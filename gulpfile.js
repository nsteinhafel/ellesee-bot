var gulp = require('gulp'),
    del = require('del'),
    exec = require('child_process').exec;

gulp.task('clean', () => {
    // Kill everything in lib.
    return del([ 'dist/**/*' ]);
});

gulp.task('tsc', (done) => {
    // Run the typescript compiler.
    exec('node ./node_modules/typescript/bin/tsc', (err, stdOut, stdErr) => {
        console.log(stdOut);
        if (err){
            done(err);
        } else {
            done();
        }
    });
});

gulp.task('copyStaticFiles', () => {
    // Copy all of our static files to lib.
    return gulp.src('src/**/*.json')
        .pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series('clean', 'tsc', 'copyStaticFiles'));
