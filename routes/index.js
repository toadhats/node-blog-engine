"use strict";
/*jshint -W079 */
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


// Load all articles from filesystem into module-scoped variable here
// Change processPage to return the array of articles instead of rendering it, refactor the function while we're at it.

// Set a timer to load them again after a set period (and reset the timer)
// Then when the user requests the index route, get the array from here, don't rebuild it. Should radically reduce time taken when index is requested

function compareDates(a,b) {
  if(a.attributes.date.isBefore(b.attributes.date)) {return -1;}
  if(b.attributes.date.isBefore(a.attributes.date)) {return 1;}
  return 0;
}

function testIfDirectory(filename) {
  return fs.lstatSync(articlesPath + '/' + filename).isDirectory();
}

// returns the dejunked filename list as a Sequence
function getAllFilenames() {
  return fs.readdirAsync(articlesPath).filter(function(filename) {
    return !testIfDirectory(filename);
  });
}

// Accepts a sequence of filenames and returns a sequence of objects containing article contents and their filenames
function getAllFiles(filenames) {
  return Promise.all(filenames.map(function(filename) {
    return fs.readFileAsync(articlesPath + '/' + filename, 'utf8').then(function(content) {
      if (!content) {
        console.error("This file is empty:", filename);
        return;
      }
      return {content: content, filename: filename};
    });
  })).then(Lazy);
}

// Processes an article file to create an article object
function processArticle(content) {
  if (!content) {
    console.error("processArticle didn't find any content to process!");
    return;
  }
  if (!fm.test(content)) {
    console.error("Bad content:", content);
    console.error("Front-matter considers this content invalid.");
    return;
  }
  var article = fm(content.toString()); // We have an article object
  article.attributes.date = moment(article.attributes.date); // Parsing to date type for consistency/sorting/shenanigans. Remember to format() back to string from within jade
  return article;
}

// Accepts a sequence of article file data and returns a sorted sequence of article objects
function parseArticles(files) {
  return files.compact().map( function(file) {
    if (!file) {
      console.error("parseArticles got an empty file");
      return;
    }
    var article = processArticle(file.content);
    if (article) {
    article.path = path.join('articles',path.basename(file.filename, path.extname(file.filename)));
    return article;
  } else {
      console.error(`Couldn't parse file "${file.filename}"`);
      return;
    }
  }).sort(compareDates, true);
}

// Our whole article fetching/parsing workflow is performed by this function, returns a complete 'cache state', e.g. feed this to the module-level articles array.
function refreshArticles() {
  console.log(moment().format('YYYY/M/D|HH:mm:ss|'), "Refreshing article cache from filesystem...");
  console.time('Cache refreshed');
  return getAllFilenames().then(getAllFiles).then(parseArticles);
}
// ** Module-scoped caching for articles. **
var storedArticles = []; // Escaped the mutable-state garbage pile.

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

// Watching for changes to the articles directory
fs.watch(articlesPath, (event, filename) => {
  if (filename) {
    console.log(`Change in file ${articlesPath}/${filename}`);
  } else {
    console.log('Change in articles folder detected.');
  }
  cacheArticles();
});
//New page load function using the cache
function processPageWithCache(res, pageNo) {
  if (!storedArticles) {
    console.error('Articles cache is empty. Rebuilding...');
    cacheArticles().then(processPageWithCache(res, pageNo));
  } else {
    // Rendering the index from cache
    var maxPage = Math.ceil(storedArticles.size() / articlesPerPage);
    var lastPage = pageNo >= maxPage; // Should eval to true if there's no more articles left to process.
    pageNo = pageNo > maxPage ? maxPage : pageNo;
    var startIndex = (pageNo - 1) * articlesPerPage;
    var articles = storedArticles.toArray().slice(startIndex, startIndex + articlesPerPage);
    res.render('index', { articles: articles, "page": pageNo, "lastPage": lastPage });
  }// End cache check else
}

/* GET article index. */
router.get('/', function(req, res, next) {
  processPageWithCache(res, 1);
});

/* GET paginated article index. */
router.get('/page/:pageNo', function(req, res, next) {
  processPageWithCache(res, req.params.pageNo);
});

module.exports = router;
