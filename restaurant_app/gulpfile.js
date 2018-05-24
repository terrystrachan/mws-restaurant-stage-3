// jshint ignore: start

const gulp = require('gulp');
const gm = require('gulp-gm');
const rename = require("gulp-rename");
const webp = require('gulp-webp');
const cleanCSS = require('gulp-clean-css');
const jshint = require('gulp-jshint');


// Lint Task
gulp.task('lint', () => {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('minify-css', () => {
  return gulp.src('./css/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('./css'));
});
 
gulp.task('minify-js', () => {
    return gulp.src('./js/*.css')
      .pipe(cleanCSS({compatibility: 'ie8'}))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('./js'));
  });
   
gulp.task('productionImages', productionImages);

function productionImages() {
    createImages(300, 's');
    createImages(600, 'm');
    createImages(900, 'l');
}

function createImages(size, suffix) {
    return gulp.src('./img/*.jpg')
        .pipe(gm(function (gmfile) {
            return gmfile.resize(size, size);
        }, {
                imageMagick: true
            }))
        .pipe(rename(function (path) { path.basename += '-' + suffix; }))
        .pipe(webp())
        .pipe(gulp.dest('./img'));
}
