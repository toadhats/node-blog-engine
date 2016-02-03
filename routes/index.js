"use strict"
var express = require('express');
var fs = require('fs');
var router = express.Router();
var fm = require('front-matter');

// Adapted from http://stackoverflow.com/a/10049704/3959735
// Takes a directory name, a function to handle the files, and a function to handle any errors
function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content); // passes the filename and the file contents into the supplied function
      });
    }); // Done looping over files in directory
  }); // Done with directory
}

// A test funciton to pass in as a callback for readFiles
function fileRetrievalTest(filename, content) {
  console.log("There is a file called " + filename);
}

/* Processes an article file to create an article object
Structure = {attributes: {title: 'Title', author: 'Don Dingus'}, body: 'Article text etc'}
*/
function processArticle(content) {
  if (!content) {
    console.error("Didn't get any article content!");
    return;
  }
  if (fm.test(content)) {
  } else {
    console.log("Front-matter considers this content invalid!");
  }
  var article = fm(content.toString());
  return article;
}

// Returns an array of processed article objects. Serious pyramid of doom, desperately needs to be refactored/nuked from orbit.
function processAllArticles(dirname, res) {
  var articles = [];
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    // Array.foreach is 95% slower than a regular for loop apparently
    for (var i = 0, len = filenames.length; i < len; i++) {
      // Need to use a closure because we are in async hell rn
      (function(i) {
      // console.log(filenames[i]); // This part seems to work
      var currentFilePath = dirname + '/' + filenames[i];
      //console.log("Trying to pass in " + currentFilePath);
      fs.readFile(currentFilePath, function(err, content) {
        articles[i] = processArticle(content)
        console.log("Processed article " + articles[i].attributes.title);

        // This is an ugly way of doing this. I should be using promises or generators instead I think.
        if (i == len - 1 ) {
          console.log("Ready to render " + articles.length + " article objects.");
          res.render('index', { articles: articles });
        } else {
          console.log("Processed " + (i+1) + " files. " + (len - (i+1)) + " remaining.");
        }
      }); // end readFile callback
    })(i) // end closure. Had to pass the iterator in like this due to async bs.
    } // end loop
  }); // end readdir callback
}

/* GET home page. */
router.get('/', function(req, res, next) {
  processAllArticles('articles', res);
});

module.exports = router;
