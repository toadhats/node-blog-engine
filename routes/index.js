"use strict";
var express = require('express');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require('fs'));
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
    return fs.readdirAsync(articlesPath);
}

// Accepts a sequence of filenames and returns a sequence of objects containing article contents and their filenames
function getAllFiles(filenames) {
  console.log("Retrieving all files.");
  // console.log(filenames);
  //filenames.then(function(x) {console.log(x);}); // This works exactly how I need it to

  return Promise.all(filenames.map(function(filename) {
    return fs.readFileAsync(articlesPath + '/' + filename, 'utf8').then(function(content) {
      return {content: content, filename: filename};
    });
  })).then(Lazy);
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

// Accepts a sequence of article file data and returns a sorted sequence of article objects
function parseArticles(files) {
  console.log("Parsing all articles.");
  return files.map( function(file) {
    var article = processArticle(file.content);
    article.path = path.join('articles',path.basename(file.filename, path.extname(file.filename)));
    return article;
  }).sort(compareDates, true);
}

// Our whole article fetching/parsing workflow is performed by this function, returns a complete 'cache state', e.g. feed this to the module-level articles array.
function refreshArticles() {
  console.log(moment().format('YYYY/M/D|HH:mm:ss|'), "Refreshing article cache from filesystem...");
  console.time('Cache refreshed');
  return getAllFilenames().then(getAllFiles).then(parseArticles);
}
// The module-level storage for parsed articles. Updated via cacheArticles.
var storedArticles = [];

// Actually updates the module state. Returns true on success, because I hate an empty return. Side effects make me nauseous but it's better than having to treat the articles as a promise everywhere, since they really should be fulfilled within less than a second of server start.
function cacheArticles() {
  refreshArticles().then(function(result) {
    storedArticles = Lazy(result);
    console.timeEnd('Cache refreshed');
    return true;
  }).catch(function(err) {
    console.error("Failed to update article cache.");
    console.error(err);
    return false;
  });
}
// This gets called for the first time on server startup
cacheArticles();

//New page load function using the cache
function processPageWithCache(res, pageNo) {
  if (!storedArticles) {
    console.error('Articles cache is empty.');
    cacheArticles();
  } else {
    // Rendering the index from cache
    var startIndex = (pageNo - 1) * articlesPerPage;
    var articles = storedArticles.toArray().slice(startIndex, startIndex + articlesPerPage);
    var lastPage = startIndex + articlesPerPage >= storedArticles.length; // Should eval to true if there's no more articles left to process.
    res.render('index', { articles: articles, "page": pageNo, "lastPage": lastPage });

  }// End cache check else
}




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
  processPageWithCache(res, 1);
  //processPage(res, 1);
});

/* GET paginated article index. */
router.get('/page/:pageNo', function(req, res, next) {
  processPageWithCache(res, req.params.pageNo);
});

module.exports = router;
