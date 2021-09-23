const { src, dest, watch, series, parallel } = require('gulp');
const gulpHtmlmin = require('gulp-htmlmin');
const gulpBabel = require('gulp-babel');
const gulpTerser = require('gulp-terser');
const gulpSass = require('gulp-sass')(require('sass'));
const gulpPostcss = require('gulp-postcss');
const gulpInject = require('gulp-inject');
const browser = require('browser-sync');
const gulpMiniCss = require('gulp-cssnano');
// const imagemin = require('gulp-imagemin');
const del = require('del');

/*=============================================
=                   html处理                  =
=============================================*/

const htmlTask = () => {
  return src('./src/*.html', { base: './src' })
    .pipe(
      gulpHtmlmin({
        minifyCSS: true,
        minifyJS: true,
        collapseWhitespace: true,
      })
    )
    .pipe(dest('./dist'));
};

/*=============================================
=                    js 处理                  =
=============================================*/
const jsTask = () => {
  return src('./src/js/*.js', { base: './src' })
    .pipe(
      gulpBabel({
        presets: [
          [
            '@babel/preset-env',
            { useBuiltIns: 'usage', corejs: { version: 3 } },
          ],
        ],
      })
    )
    .pipe(
      gulpTerser({
        mangle: {
          toplevel: true,
        },
      })
    )
    .pipe(dest('./dist'));
};

/*=============================================
=                   scss 处理                 =
=============================================*/

const scssTask = () => {
  return src('./src/scss/*.scss')
    .pipe(gulpSass())
    .pipe(gulpPostcss([require('postcss-preset-env')]))
    .pipe(gulpMiniCss())
    .pipe(dest('./dist/css'));
};

/*=============================================
=                    css 处理                 =
=============================================*/

const cssTask = () => {
  return src('./src/css/*.css')
    .pipe(gulpPostcss([require('postcss-preset-env')]))
    .pipe(gulpMiniCss())
    .pipe(dest('./dist/css'));
};

/**
 * TODO 尝试了几个都不太行
 * 处理图片信息
 */
const imgTask = () => {
  return (
    src('./src/images/**/*', { base: './src' })
      // .pipe(imagemin())
      .pipe(dest('./dist'))
  );
};

/*=============================================
=             将lib下文件copy到dist            =
=============================================*/

const libraryTask = () => {
  return src('./src/library/**/*', { base: './src' }).pipe(dest('./dist'));
};

/*=============================================
=                    自动引入                  =
=============================================*/

const injectHtml = () => {
  return src('./dist/*.html')
    .pipe(
      gulpInject(src(['./dist/js/*.js', './dist/css/*.css']), {
        relative: true,
      })
    )
    .pipe(dest('./dist'));
};

/*=============================================
=                    删除dist                 =
=============================================*/

const clean = () => {
  return del(['dist']);
};

/*=============================================
=                    本地环境                 =
=============================================*/

const bs = browser.create();
const server = () => {
  watch('./src/*.html', series(htmlTask, injectHtml));
  watch('./src/js/*.js', series(jsTask, injectHtml));
  watch('./src/scss/*.scss', series(scssTask, injectHtml));
  watch('./src/css/*.css', series(cssTask, injectHtml));
  watch('./src/library/**/*', series(libraryTask));
  watch('./src/images/**/*', series(imgTask));
  bs.init({
    port: 8090,
    open: true,
    files: './dist/*',
    server: { baseDir: './dist' },
  });
};

const buildTask = series(
  clean,
  parallel(htmlTask, jsTask, scssTask, cssTask, libraryTask, imgTask),
  injectHtml
);
const serverTask = series(buildTask, server);

exports.server = serverTask;
exports.build = buildTask;
exports.default = serverTask;
