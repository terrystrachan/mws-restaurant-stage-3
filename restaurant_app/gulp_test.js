const gulp = require('gulp');
const gm = require('gulp-gm');
const rename = require("gulp-rename");
const runSequence = require('run-sequence');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

var pump = require('pump');

gulp.task('compress', function (cb) {
    pump([
        gulp.src('./js/*.js'),
        babel({
            presets: ['env']
        }),
        uglify({ mangle: false }),
        gulp.dest('dist/js')
    ],
        cb
    );
});

gulp.task('minify-css', () => {
    return gulp.src('./css/*.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('copyroot', copyroot);
gulp.task('copyicons', copyicons);
gulp.task('productionImages', productionImages);

gulp.task('dist', ['copyroot', 'copyicons', 'productionImages', 'minify-css', 'js']);

gulp.task('build', function (callback) {
    runSequence(
        'copyroot',
        'copyicons',
        'productionImages',
        'minify-css',
        'js',
        function (error) {
            if (error) {
                console.log(error.message);
            } else {
                console.log('RELEASE FINISHED SUCCESSFULLY');
            }
            callback(error);
        });
});

gulp.task('concat', function () {
    return gulp.src('**/*.js')
        .pipe(concat('bundle.min.js'))
        .pipe(uglify({ mangle: false }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('js', function () {

    return gulp.src(['./js/*.js'])
      //  .pipe(concat('bundle.min.js'))
//        .pipe(rename('scripts.js'))
        //.pipe(babel({ presets: ['env'] }))
        //.pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

function productionImages() {
    resizeImages(300, 's');
    resizeImages(600, 'm');
    resizeImages(900, 'l');
}

function resizeImages(size, suffix) {
    return gulp.src('./img/*.jpg')
        .pipe(gm(function (gmfile) {
            return gmfile.resize(size, size);
        }, {
                imageMagick: true
            }))
        .pipe(rename(function (path) { path.basename += '-' + suffix; }))
        .pipe(gulp.dest('./img'));
}

function copyroot(done) {

    var filesToMove = [
        './*.png',
        './*.ico',
        './*.html',
        './manifest.json',
        './sw.js',
        './browserconfig.xml',
        './site.webmanifest',
        './*.svg'
    ];

    return gulp.src(filesToMove)
        .pipe(gulp.dest('dist'));

}


function copyicons(done) {
    var filesToMove = [
        './img/icons/*.*'
    ];
    return gulp.src(filesToMove)
        .pipe(gulp.dest('dist/img/icons'));
}