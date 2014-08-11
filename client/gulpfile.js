var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')();

var scriptsGlob = 'src/js/*.js',
    cssGlob = 'src/css/*.css',
    scssGlob = 'src/scss/*.scss',
    htmlGlob = 'src/*.html',
    imgGlob = 'src/img/*',
    testGlob = 'test/test-runner.html',
    assetsGlob = plugins.gulpBowerFiles();

var siteUrl = 'http://localhost/';

gulp.task('clean', function() {
    gulp.src('dist', {
        read: false
    })
        .pipe(plugins.plumber())
        .pipe(plugins.rimraf())
        .on('error', plugins.util.log)
});

gulp.task('images', function() {
    gulp.src(imgGlob)
        .pipe(plugins.plumber())
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngcrush()]
        }))
        .pipe(gulp.dest('dist/img/'))
        .pipe(plugins.webp())
        .pipe(gulp.dest('dist/img/webp'))
        .on('error', plugins.util.log)
});

gulp.task('process-html', function() {
    gulp.src(htmlGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.htmlv())
        .pipe(plugins.cleanhtml())
        .pipe(plugins.prettify())
        .pipe(gulp.dest('dist/'))
        .on('error', plugins.util.log)
});

gulp.task('process-scss', function() {
    gulp.src(scssGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.changed('dist/scss/'))
        .pipe(plugins.sass())
        .pipe(plugins.scsslint())
        .pipe(gulp.dest('dist/css'))
        .on('error', plugins.util.log)
});

gulp.task('process-css', function() {
    gulp.src(cssGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.changed('dist/css/'))
        .pipe(plugins.concat('style.css'))
        .on('error', plugins.util.log)
});

gulp.task('post-process-styles', function() {
    gulp.src(cssGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.uncss({
          html: htmlGlob
        }))
        .pipe(plugins.colorguard())
        .pipe(plugins.prefix({
            cascade: true
        }))
        .pipe(plugins.cmq())
        .pipe(plugins.recess())
        .pipe(gulp.dest('dist/css/'))
        .pipe(plugins.csso())
        .pipe(plugins.rename('style.min.css'))
        .pipe(gulp.dest('dist/css/'))
        .pipe(plugins.bless())
        .pipe(gulp.dest('dist/css/ie/'))
        .on('error', plugins.util.log)
});

gulp.task('scripts', function() {
    gulp.src(scriptsGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.jshint())
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.stripDebug())
        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest('dist/js/'))
        .pipe(plugins.uglify())
        .pipe(plugins.sourcemaps.write())
        .pipe(plugins.rename('app.min.js'))
        .pipe(gulp.dest('dist/js/'))
        .on('error', plugins.util.log)
});

gulp.task('polyfill', function() {
    gulp.src(assetsGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.autopolyfiller('polyfill.js'))
        .pipe(gulp.dest('dist/js/'))
        .pipe(plugins.uglify())
        .pipe(plugins.rename('polyfill.min.js'))
        .pipe(gulp.dest('dist/js/'))
        .on('error', plugins.util.log)
});

gulp.task('manifest', function() {
    gulp.src('dist/*/*')
        .pipe(plugins.plumber())
        .pipe(plugins.manifest({
            hash: true,
            preferOnline: true,
            network: ['http://*', 'https://*', '*'],
            filename: 'app.manifest',
            exclude: 'app.manifest'
        }))
        .pipe(gulp.dest('dist/'))
        .on('error', plugins.util.log)
});

gulp.task('test', function() {
    gulp.src(testGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.qunit())
        .on('error', plugins.util.log)
});

gulp.task('loc', function() {
    gulp.src(scriptsGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.sloc())
        .on('error', plugins.util.log)
});

gulp.task('zip', function() {
    gulp.src('./*')
        .pipe(plugins.plumber())
        .pipe(plugins.zip('app.zip'))
        .pipe(gulp.dest('/'))
});

gulp.task('sitemap', function() {
    gulp.src(htmlGlob, {
        read: false
    })
        .pipe(plugins.plumber())
        .pipe(plugins.sitemap({
            siteUrl: siteUrl
        }))
        .pipe(gulp.dest('dist/'))
        .on('error', plugins.util.log)
});

gulp.task('todo', function() {
    gulp.src(scriptsGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.todo())
        .pipe(gulp.dest(''))
        .on('error', plugins.util.log)
});

gulp.task('docs', function() {
    gulp.src(scriptsGlob)
        .pipe(plugins.plumber())
        .pipe(plugins.yuidoc())
        .pipe(gulp.dest('docs/'))
        .on('error', plugins.util.log)
});

gulp.task('humans', function() {
    gulp.src()
});
