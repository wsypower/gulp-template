const { src, dest, watch, series, parallel } = require('gulp');
const gulpHtmlmin = require('gulp-htmlmin');
const gulpBabel = require('gulp-babel');
const gulpTerser = require('gulp-terser');
const gulpSass = require('gulp-sass')(require('sass'));
const gulpPostcss = require('gulp-postcss');
const gulpInject = require('gulp-inject');
const browser = require('browser-sync');
const imagemin = require('gulp-imagemin');
const del = require('del');
/**
 * @description html处理
 */
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

/**
 * @description js 处理
 */
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

/**
 * @description scss 处理
 */
const scssTask = () => {
  return src('./src/scss/*.scss')
    .pipe(gulpSass())
    .pipe(gulpPostcss([require('postcss-preset-env')]))
    .pipe(dest('./dist/css'));
};

/**
 * @description 处理图片信息
 */
const imgTask = () => {
  return src('./src/*', { base: './src' })
    .pipe(imagemin())
    .pipe(dest('./dist'));
};

/**
 * @description 将lib下文件copy到dist
 */
const copy = () => {
  return src('./src/lib/**/*', { base: './src' }).pipe(dest('./dist/lib'));
};

/**
 * @description 自动引入
 */
const injectHtml = () => {
  return src('./dist/*.html')
    .pipe(
      gulpInject(src(['./dist/js/*.js', './dist/css/*.css']), {
        relative: true,
      })
    )
    .pipe(dest('./dist'));
};

/**
 * @description 删除dist
 */
const clean = () => {
  return del(['dist']);
};

/**
 * @description 本地环境
 */
const bs = browser.create();
const server = () => {
  watch('./src/*.html', series(htmlTask, injectHtml));
  watch('./src/js/*.js', series(jsTask, injectHtml));
  watch('./src/scss/*.scss', series(scssTask, injectHtml));
  watch('./src/imgTask/*', series(imgTask));
  watch('./src/lib/**/*', series(copy));
  bs.init({
    port: 8090,
    open: true,
    files: './dist/*',
    server: { baseDir: './dist' },
  });
};

const buildTask = series(
  clean,
  parallel(htmlTask, jsTask, scssTask, imgTask, copy),
  injectHtml
);
const serverTask = series(buildTask, server);

exports.server = serverTask;
exports.build = buildTask;
exports.default = serverTask;
