'use strict';

var fs = require('fs');
var fse = require('fs-extra');
var rootpath = require('app-root-path');
var yargs = require('yargs');
var getSites = function() {
    var sites;
    if (yargs.argv.site) {
        sites = yargs.argv.site.replace(/^\s*|\s*$/g,'').split(/\s*,\s*/);
    }
    else {
        sites = ['mla'];
    }

    return sites;
};

module.exports = {

    init: function() {

        var sites = getSites();

        try {
            var nwconfjs = JSON.parse(fs.readFileSync(rootpath + '/nightwatch.json','utf8'));
            var reportsPath = rootpath + '/' + nwconfjs.output_folder;
            for (var site in sites) {
                fse.ensureDirSync(reportsPath + '/' + sites[site]);
            }

        }
        catch (e) {
            console.error(e.message);
        }

    },

    generateJsonReports: function(results, done) {

        var nwconfjs = JSON.parse(fs.readFileSync(rootpath + '/nightwatch.json','utf8'));
        var reportsPath = rootpath + '/' + nwconfjs.output_folder;
        var sites = getSites();

        console.log('Generating report files...');

        for (var site in sites) {
            for (var module in results.modules) {
                var siteReportPath = reportsPath + '/' + sites[site] + '/';
                var replaceSlash = module.replace(/\//g, '-');
                var filename = replaceSlash + '.json';
                var moduleData = results.modules[module];
                fs.writeFileSync(siteReportPath + filename, JSON.stringify(moduleData), 'utf8');
            }
        }
        console.log('Done generating report files!');
        done();
    },

    summarizeAndPrintResults: function(done) {
        var nwconfjs = JSON.parse(fs.readFileSync(rootpath + '/nightwatch.json','utf8'));
        var reportsPath = rootpath + '/' + nwconfjs.output_folder;
        var sites = getSites();

        console.log('\n***************************');
        console.log('* <<<<< RUN SUMMARY >>>>> *');
        console.log('***************************\n');

        for (var site in sites) {
            var siteReportPath = reportsPath + '/' + sites[site] + '/';
            var reports = fs.readdirSync(siteReportPath, 'utf8').filter(function(elem) {
                return !elem.startsWith('summary') && elem.endsWith('.json');
            });

            var summary = {
                tests: 0,
                failures: 0,
                errors: 0
            };

            for (var i = 0; i < reports.length;i++) {

                var file = JSON.parse(fs.readFileSync(siteReportPath + '/' + reports[i], 'utf8'));
                summary.tests += file.tests;
                summary.failures += file.failures;
                summary.errors += file.errors;
            }

            fs.writeFileSync(siteReportPath + '/summary.json', JSON.stringify(summary), 'utf8');

            console.log('['+sites[site]+']')
            console.log('Total tests: ' + summary.tests);
            console.log('Total failures: ' + summary.failures);
            console.log('Total errors: ' + summary.errors);
            console.log('\n');
        }

        done();
        //console.log(JSON.stringify(summary));
    }
};