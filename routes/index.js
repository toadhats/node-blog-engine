"use strict"
var express = require('express');
var fs = require('fs');
var router = express.Router();
var fm = require('front-matter');
var moment = require('moment');

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

// Processes an article file to create an article object
function processArticle(content) {
  if (!content) {
    console.error("Didn't get any article content!");
    return;
  }
  if (!fm.test(content)) {
    console.error("Bad content: " + content);
    console.error("Front-matter considers this content invalid!");
  }
  var article = fm(content.toString()); // We have an article object
  article.attributes.date = moment(article.attributes.date); // Parsing to date type for consistency/sorting/shenanigans. Remember to format() back to string from within jade
  return article;
}

/*
attributes: {
    title: "Auth0's Security Buzz just launched!"
    description: Our new channel for sharing our thoughts on security
    date: Moment.js object
    author:
        {
        name: Diego Poza,
        url: https://twitter.com/diegopoza,
        avatar: https://avatars3.githubusercontent.com/u/604869?v=3&s=200,
        mail: diego.poza@auth0.com
        }
    design:
        {
        bg_color: "#254973",
        image: https://cdn.auth0.com/blog/announcing-security-buzz/logo.png
        }
    tags:
     [security buzz, security news]
    },
body: Actual text of the article.
*/

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
        //console.log(currentFilePath);// debug delete
        articles[i] = processArticle(content);
        articles[i].path = currentFilePath.substr(0, currentFilePath.lastIndexOf('.'));//remove the extension

        // This is an ugly way of doing this. I should be using promises or generators instead I think.
        if (i == len - 1 ) {
          console.log("Sorting articles by date (descending)");
          articles = sortByDate(articles); // This isn't working properly.
          console.log("Ready to render " + articles.length + " article objects.");
          res.render('index', { articles: articles });
        } else {
          //console.log("Processed " + (i+1) + " files. " + (len - (i+1)) + " remaining.");
        }
      }); // end readFile
    })(i) // Immediately invoked function expression. Had to pass the iterator in like this due to async bs.
    } // end loop
  }); // end readdir callback
}

/* Function that generates a sort function for a given field
   Adapted from http://stackoverflow.com/a/979325/3959735
   Primer parameter is a function that is applied to the field value before comparison.
*/
var sortBy = function(field, reverse, primer){

  var key = primer ?
  function(x) {return primer(x[field])} :
  function(x) {return x[field]};

  reverse = !reverse ? 1 : -1;

  return function (a, b) {
    return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
  };
};

// Compare dates to sort
function compareDates(a,b) {
	if(a.attributes.date.unix() < b.attributes.date.unix()) return -1;
	if(a.attributes.date.unix() > b.attributes.date.unix()) return 1;
	return 0;
}

// Function to sort articles array by date
function sortByDate(articleArray) {
  return articleArray.sort(compareDates).reverse();
}


/* GET article index. */
router.get('/', function(req, res, next) {
  processAllArticles('articles', res);
});

module.exports = router;
