"use strict"

const gulp = require('gulp');
const typescript = require('gulp-typescript');
const merge = require('merge2');  
const tslint = require("gulp-tslint");
const clean = require("gulp-clean");
const sourcemaps = require("gulp-sourcemaps");
const gulpCopy = require("gulp-copy");
const relativeSourcemapsSource = require('gulp-relative-sourcemaps-source');
const mocha = require("gulp-spawn-mocha");
const apidoc = require('gulp-apidoc');

const tsProject = typescript.createProject('tsconfig.json', {declaration: true});

// clean lib/ folder before recompile
gulp.task("clean", function(){
    return merge([
        gulp.src('lib/definitions/*', {read: false}).pipe(clean()),
        gulp.src('lib/js/*', {read: false}).pipe(clean())
    ]);
})

// wipe lib/ folder
gulp.task("cleanAll", function(){
    return gulp.src('lib', {read: false}).pipe(clean());
})

// compile project
gulp.task('build', gulp.series(
    'clean',
    function() {  
        gulp.task()
        var tsResult = tsProject.src()
            .pipe(sourcemaps.init())
            .pipe(tslint({configuration: "tslint.json"}))
            .pipe(tslint.report({emitError: false}))
            .pipe(tsProject());
            
        return merge([
            tsResult.js
                .pipe(relativeSourcemapsSource({dest: 'lib/js'}))
                .pipe(sourcemaps.write('.', {
                    includeContent: false,
                }))
                .pipe(gulp.dest('lib/js')),
            tsResult.dts.pipe(gulp.dest('lib/definitions')),
            gulp.src("src/**/*.js").pipe(gulpCopy("lib/js/", {prefix: 1}))
        ])
    }
));

gulp.task('test', function() {
    return gulp.src([
        "lib/js/**/*.test.js",
    ])
        .pipe(mocha({
            env: {
                'NODE_ENV': 'test',
                "BLUEBIRD_LONG_STACK_TRACES": "1"
            },
            require: ['ts-node/register'],
            timeout: 5000
        }));
})

gulp.task('apidoc:gen', function(done){
    apidoc({
        src: "src/",
        dest: "docs/",
        config: "./"
    },done);
});
