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
	gulp.start('get-bootstrap', 'get-slick-carousel', 'get-font-awesome', 'get-jquery', 'get-knockout', 'minify-scripts', 'minify-css', 'minify-html');
});

gulp.task('minify-scripts', function() {
	return gulp.src('docs/js/**/*.js')
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'))
		.pipe(notify({ message: 'Minifying scripts complete' }));
});

gulp.task('minify-css', function() {
	return gulp.src('docs/css/**/*.css')
		.pipe(rename({suffix: '.min'}))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(gulp.dest('dist/css'))
		.pipe(notify({ message: 'Minifying CSS complete' }));
});

gulp.task('minify-html', function() {
	return gulp.src('docs/*.html')
		.pipe(rename({suffix: '.min'}))
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('dist'))
		.pipe(notify({ message: 'Minifying CSS complete' }));
});

gulp.task('clean', function() {
	return del(['dist/css', 'dist/js', 'dist/img', 'dist']);
});


/////////////////////
// Get extra files //
/////////////////////
gulp.task('get-bootstrap', function() {
	gulp.src('./node_modules/bootstrap/dist/css/bootstrap.css')
		.pipe(gulp.dest('./docs/css/plug-ins/'));
});

gulp.task('get-knockout', function() {
	gulp.src('./node_modules/knockout/build/output/knockout-latest.js')
		.pipe(gulp.dest('./docs/js/plug-ins/'));
});

gulp.task('get-jquery', function() {
	gulp.src('./node_modules/jquery/dist/jquery.min.js')
		.pipe(gulp.dest('./docs/js/plug-ins/'));
});

gulp.task('get-font-awesome', function() {
	gulp.src('./node_modules/font-awesome/css/font-awesome.css')
		.pipe(gulp.dest('./docs/css/plug-ins/'));

	gulp.src('./node_modules/font-awesome/fonts/*')
		.pipe(gulp.dest('./docs/fonts/'));
});

gulp.task('get-slick-carousel', function() {
	gulp.src('./node_modules/slick-carousel/slick/*.css')
		.pipe(gulp.dest('./docs/css/plug-ins/'));

	// Modified manually, should not be overwritten
	// gulp.src('./node_modules/slick-carousel/slick/*.min.js')
	// 	.pipe(gulp.dest('./docs/js/plug-ins/'));

	gulp.src('./node_modules/slick-carousel/slick/*.gif')
		.pipe(gulp.dest('./docs/img/plug-ins/'));
});


//////////////////////////////////////
// Watch Files For Changes & Reload //
//////////////////////////////////////
gulp.task('serve', function() {
	browserSync({
		notify: false,
		// Customize the BrowserSync console logging prefix
		logPrefix: 'WSK',
		// Run as an https by uncommenting 'https: true'
		// Note: this uses an unsigned certificate which on first access
		//       will present a certificate warning in the browser.
		// https: true,
		server: ['.tmp', 'docs']
	});

	gulp.watch(['docs/*.html'], reload);
	gulp.watch(['docs/css/*.{scss,css}'], reload);
	gulp.watch(['docs/js/*.js'], reload);
	gulp.watch(['docs/images/**/*'], reload);
});