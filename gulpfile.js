var gulp = require ('gulp');
var babel = require ('gulp-babel');


gulp.task('babel',function(){
	console.log('launch of babel task');
	return gulp.src('src/index.js')
	.pipe(babel({
		presets:['es2015']
	}))
	.pipe(gulp.dest('dist'))
});