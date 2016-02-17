"use strict";
var express = require('express');
var Promise = require("bluebird");
var fs = require('fs'); // TODO: remove this once I've migrated to using promises
var fsPromise = Promise.promisifyAll(require('fs'));
var path = require("path");
var router = express.Router();
var fm = require('front-matter');
var moment = require('moment');
var junk = require('junk');
var Lazy = require('lazy.js');
var tcg = require('../tag-cloud-generator.js');
// Environment variables with default values
var articlesPerPage = process.env.articlesPerPage || 5; // This doesn't seem to be working properly on heroku, it renders way too many.
var articlesPath = process.env.articlesPath || 'articles'; // Will probably never change, but just in case

// ** Module-scoped caching for articles. **

// Load all articles from filesystem into module-scoped variable here
// Change processPage to return the array of articles instead of rendering it, refactor the function while we're at it.

// Set a timer to load them again after a set period (and reset the timer)
// Then when the user requests the index route, get the array from here, don't rebuild it. Should radically reduce time taken when index is requested

function compareDates(a,b) {
  if(a.attributes.date.isBefore(b.attributes.date)) {return -1;}
  if(b.attributes.date.isBefore(a.attributes.date)) {return 1;}
  return 0;
}

// This function belongs in the mutable-state garabage pile
function sortByDate(articleArray) {
  return articleArray.sort(compareDates).reverse();
}

// returns the dejunked filename list as a Sequence
function getAllFilenames() {
  console.log("Getting all filenames.");
    return Lazy(fsPromise.readdirAsync(articlesPath).then(function(filenames) {
      console.log("getAllFilenames returned: " + filenames); // IT BREAKS AFTER HERE LOL
      return filenames;
    }));
}

// Accepts a sequence of filenames and returns a sequence of objects containing article contents and their filenames
function getAllFiles(filenames) {
  console.log("Retrieving all files.");
  return Promise.all(filenames.map(function(filename) {
    return fsPromise.readFileAsync(articlesPath + '/' + filename, 'utf8').then(function(content) {
        return {content: content, filename: filename};
    });
})).then(Lazy);
} // We're out of async jail now

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

// Accepts a sequence of article file data and returns a sorted sequence of article objects
function parseArticles(files) {
  console.log("Parsing all articles.");
  return files.map( function(file) {
    var article = processArticle(file.content);
    article.path = path.basename(file.filename, path.extname(file.filename));
    return article;
  });//.sort(compareDates, true); // toProcess is a sequence of article objects with nulls culled.
}

// Our whole article fetching/parsing workflow is performed by this function, returns a complete 'cache state', e.g. feed this to the module-level articles array.
function refreshArticles() {
  console.log("Refreshing article cache from filesystem...");
  return parseArticles(getAllFiles(getAllFilenames()));
}

// This breaks everything in the ugliest way possible and will be hell to debug. Tomorrow.
//var articles = refreshArticles(); // This should actually begin the parsing workflow, should trigger on startup

// ** OLD VERSION **

// New version of processAllArticles that will handle pagination of the index.
function processPage(res, pageNo) {
  var articles = [];
  var startIndex = (pageNo - 1) * articlesPerPage;
  // console.log("Page " + pageNo);
  fs.readdir(articlesPath, function(err, filenames) {
    if (err) {
      throw err;
    }
    filenames = filenames.filter(junk.not); // gets rid of junk like .DS_Store

    var filesRemaining = filenames.length;// Keeping track of how many files we've processed
    for (var i = 0, len = filenames.length; i < len; i++) {
      // Need to use a closure because we are in async hell rn
      (function(i) {
        var currentFilePath = articlesPath + '/' + filenames[i];
        fs.readFile(currentFilePath, function(err, content) {
          if (err) {
            throw err;
          }
          articles[i] = processArticle(content);
          articles[i].path = currentFilePath.substr(0, currentFilePath.lastIndexOf('.'));//remove the extension
          // We've processed an article, so decrement filesRemaining
          filesRemaining -= 1;
          if (filesRemaining === 0 ) {
            articles = sortByDate(articles);
            // Creating the tag cloud before we slice down to one page
            var tags = tcg.getTagsWithCount(articles);
            var formattedTags = tcg.formatForTagCloud(tags);

            articles = articles.slice(startIndex, startIndex + articlesPerPage);
            var lastPage = startIndex + articlesPerPage >= filenames.length; // Should eval to true if there's no more articles left to process.
            res.render('index', { articles: articles, "page": pageNo, "lastPage": lastPage });
          }
        }); // end readFile
      })(i); // Immediately invoked function expression. Had to pass the iterator in like this due to async bs.
    } // end loop
  }, // end result handling callback
  function(err){ // end error handling callback
    throw err;
  }); // end readdir
}

/* GET article index. */
router.get('/', function(req, res, next) {
  processPage(res, 1);
});

/* GET paginated article index. */
router.get('/page/:pageNo', function(req, res, next) {
  processPage(res, req.params.pageNo);
});

module.exports = router;
