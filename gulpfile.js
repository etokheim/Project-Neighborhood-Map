var gulp =			require('gulp'),
	browserSync =	require('browser-sync'),
	reload =		browserSync.reload,
	uglify =		require('gulp-uglify'),
	cache =			require('gulp-cache'),
	del =			require('del'),
	rename =		require('gulp-rename'),
	notify =		require('gulp-notify'),
	htmlmin =		require('gulp-htmlmin'),
	cleanCSS =		require('gulp-clean-css'),
	usemin =		require('gulp-usemin');

// Gulp default task
gulp.task('default', ['clean'], function() {
    gulp.start('get-bootstrap', 'minify-scripts', 'minify-css', 'minify-html');
});

gulp.task('minify-scripts', function() {
 	return gulp.src('src/js/**/*.js')
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'))
		.pipe(notify({ message: 'Minifying scripts complete' }));
});

gulp.task('minify-css', function() {
	return gulp.src('src/css/**/*.css')
		.pipe(rename({suffix: '.min'}))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(gulp.dest('dist/css'))
		.pipe(notify({ message: 'Minifying CSS complete' }));
});

gulp.task('minify-html', function() {
	return gulp.src('src/*.html')
		.pipe(rename({suffix: '.min'}))
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('dist'))
		.pipe(notify({ message: 'Minifying CSS complete' }));
});

// Get bootstrap files
gulp.task("get-bootstrap", function() {
   gulp.src("./node_modules/bootstrap/dist/css/bootstrap.css")
       .pipe(gulp.dest("./src/css/plug-ins"));
});

gulp.task('clean', function() {
	return del(['dist/css', 'dist/js', 'dist/img', 'dist']);
});

// Watch Files For Changes & Reload
gulp.task('serve', function() {
	browserSync({
		notify: false,
		// Customize the BrowserSync console logging prefix
		logPrefix: 'WSK',
		// Run as an https by uncommenting 'https: true'
		// Note: this uses an unsigned certificate which on first access
		//       will present a certificate warning in the browser.
		// https: true,
		server: ['.tmp', 'src']
	});

	gulp.watch(['src/*.html'], reload);
	gulp.watch(['src/css/*.{scss,css}'], reload);
	gulp.watch(['src/js/*.js'], reload);
	gulp.watch(['src/images/**/*'], reload);
});