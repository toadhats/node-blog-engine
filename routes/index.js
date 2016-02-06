"use strict";
var express = require('express');
var fs = require('fs');
var path = require("path");
var router = express.Router();
var fm = require('front-matter');
var moment = require('moment');
var junk = require('junk');
// Environment variables with default values
var articlesPerPage = process.env.articlesPerPage || 5;
var articlesPath = process.env.articlesPath || 'articles'; // Will probably never change, but just in case

function compareDates(a,b) {
  if(a.attributes.date.isBefore(b.attributes.date)) {return -1;}
  if(b.attributes.date.isBefore(a.attributes.date)) {return 1;}
  return 0;
}

function sortByDate(articleArray) {
  return articleArray.sort(compareDates).reverse();
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

// New version of processAllArticles that will handle pagination of the index.
function processPage(res, pageNo) {
  var articles = [];
  var startIndex = (pageNo - 1) * articlesPerPage;
  console.log("Page " + pageNo);
  fs.readdir(articlesPath, function(err, filenames) {
    if (err) {
      throw err;
    }
    filenames = filenames.filter(junk.not);
    // Array.foreach is 95% slower than a regular for loop apparently
    for (var i = 0, len = filenames.length; i < len; i++) {
      // Need to use a closure because we are in async hell rn
      (function(i) {
        var currentFilePath = articlesPath + '/' + filenames[i];
        fs.readFile(currentFilePath, function(err, content) {
          articles[i] = processArticle(content);
          articles[i].path = currentFilePath.substr(0, currentFilePath.lastIndexOf('.'));//remove the extension

          if (i === len - 1 ) {
            //console.log("Sorting articles by date (descending)");
            articles = sortByDate(articles);
            //console.log("Articles length before slice: " + articles.length);
            articles = articles.slice(startIndex, startIndex + articlesPerPage + 1);
            //console.log("Trimmed articles to length " + articles.length);
            res.render('index', { articles: articles, "page": pageNo });
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
