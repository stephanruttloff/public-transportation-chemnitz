module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({

        bower_concat: {
            all: {
                dest: 'public/js/bower.js',
                cssDest: 'public/css/bower.css'
            }
        },

        cssmin: {
            bower:{
                src: 'public/css/bower.css',
                dest: 'public/css/bower.min.css'
            },
            app:{
                src: 'public/css/style.css',
                dest: 'public/css/style.min.css'
            }
        },

        uglify: {
            bower: {
                files: {
                    'public/js/bower.min.js' : [ 'public/js/bower.js' ]
                }
            },
            app: {
                files: {
                    'public/js/app.min.js': ['public/js/app.js']
                }
            }
        },

        clean: {
            css: ['public/css/*.css', '!public/css/*.min.css', '!public/css/style.css'],
            js: ['public/js/*.js', '!public/js/*.min.js', '!public/js/app.js'],
            bower: ['bower_components']
        }

    });

    grunt.registerTask('default', ['bower_concat', 'cssmin', 'uglify', 'clean']);
}