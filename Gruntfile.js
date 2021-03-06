module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-myth');
    grunt.loadNpmTasks('grunt-sass');

    grunt.initConfig({

        sass: {
            options: {
                sourceMap: false
            },
            dist: {
                files: {
                    'src/sass/map.css': 'src/sass/map.scss'
                }
            }
        },

        bower_concat: {
            all: {
                dest: 'src/js/bower.js',
                cssDest: 'src/css/bower.css'
            }
        },

        myth: {
            options: {
                sourcemap: true
            },
            css: {
                files: {
                    'src/css/style.polyfill.css': 'src/css/style.css',
                    'src/css/animation.polyfill.css': 'src/css/animation.css'
                }
            },
            sass: {
                files: {
                    'src/sass/map.polyfill.css': 'src/sass/map.css'
                }
            }
        },

        cssmin: {
            bower:{
                src: 'src/css/bower.css',
                dest: 'public/css/bower.min.css'
            },
            app:{
                src: 'src/css/style.polyfill.css',
                dest: 'public/css/style.min.css'
            },
            animation:{
                src: 'src/css/animation.polyfill.css',
                dest: 'public/css/animation.min.css'
            },
            sass:{
                src: 'src/sass/map.polyfill.css',
                dest: 'public/css/map.min.css'
            }
        },

        uglify: {
            bower: {
                files: {
                    'public/js/bower.min.js' : [ 'src/js/bower.js' ]
                }
            },
            app: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true
                },
                files: {
                    'public/js/app.min.js': ['src/js/app.js']
                }
            }
        },

        copy: {
            img: {
                files: [
                    {expand: true, cwd: 'src/img/', src: ['**'], dest: 'public/img/',},
                ]
            },
            partials: {
                files: [
                    {expand: true, cwd: 'src/partials/', src: ['**'], dest: 'public/partials/'}
                ]
            },
            resources: {
                files: [
                    {expand: true, cwd: 'src/resources/', src: ['**'], dest: 'public/resources/'}
                ]
            }
        },

        preprocess: {
            release: {
                src: 'src/index.html',
                dest: 'public/index.html',
                options: {
                    context: {
                        NODE_ENV: 'production'
                    }
                }
            },
            dev: {
                src: 'src/index.html',
                dest: 'public/index.html',
                options: {
                    context: {
                        NODE_ENV: 'development'
                    }
                }
            }
        },

        clean: {
            css: ['public/css/*.css', '!public/css/*.min.css', 'src/css/*.min.css', 'src/css/*.polyfill.css', 'src/sass/*.css'],
            js: ['public/js/*.js', '!public/js/*.min.js', 'src/js/*.min.js'],
            bower: ['src/css/bower.*', 'src/js/bower.*'],
            release: ['public/*']
        },

        concurrent: {
            dev: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },

        nodemon: {
            dev: {
                script: 'server.js',
                options: {
                    args: ['80'],
                    // omit this property if you aren't serving HTML files and
                    // don't want to open a browser tab on start
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });

                        // opens browser on initial server start
                        nodemon.on('config:update', function () {
                            // Delay before server listens on port
                            setTimeout(function() {
                                require('open')('http://localhost:80');
                            }, 1000);
                        });

                        // refreshes browser when server reboots
                        nodemon.on('restart', function () {
                            // Delay before server listens on port
                            setTimeout(function() {
                                require('fs').writeFileSync('.rebooted', 'rebooted');
                            }, 1000);
                        });
                    }
                }
            }
        },

        watch: {
            options: {
                livereload: true
            },
            js: {
                files: ['src/js/app.js'],
                tasks: ['uglify:app'],
                options: {
                    spawn: false
                },
            },
            css: {
                files: ['src/css/style.css'],
                tasks: ['myth:css', 'cssmin:app', 'clean:css'],
                options: {
                    spawn: false
                },
            },
            animation: {
                files: ['src/css/animation.css'],
                tasks: ['myth:css', 'cssmin:animation', 'clean:css'],
                options: {
                    spawn: false
                },
            },
            partials: {
                files: ['src/partials/*.html'],
                tasks: ['copy:partials'],
                options: {
                    spawn: false
                },
            },
            index: {
                files: ['src/index.html'],
                tasks: ['preprocess:dev'],
                options: {
                    spawn: false
                },
            },
            sass: {
                files: ['src/sass/*.scss'],
                tasks: ['sass', 'myth:sass', 'cssmin:sass', 'clean:css'],
                options: {
                    spawn: false
                },
            },
            server: {
                files: ['.rebooted']
            },
        },

    });

    grunt.registerTask('default', [
        'clean:release',
        'sass',
        'bower_concat',
        'myth',
        'cssmin',
        'uglify',
        'copy',
        'preprocess:release',
        'clean:css',
        'clean:js',
        'clean:bower'
    ]);
    grunt.registerTask('dev', [
        'clean:release',
        'sass',
        'bower_concat',
        'myth',
        'cssmin',
        'uglify',
        'copy',
        'preprocess:dev',
        'clean:css',
        'clean:js',
        'clean:bower',
        'concurrent:dev'
    ]);
}