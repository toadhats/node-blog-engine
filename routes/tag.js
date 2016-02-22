"use strict";
var express = require('express');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require('fs')); // "Promisified" version of fs – no more callbacks.
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
  article.attributes.date = moment(article.attributes.date); //Remember to format() back to string from within jade
  // debug junk
  // var gotTags = article.attributes.tags;
  // if (gotTags){
  //   console.log("Got tags:", gotTags);
  // } else {
  //   console.log("This article has no tags:", article.path);
  // }

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

function hasTag(article, tag) {
  return Lazy(article.attributes.tags).contains(tag);
}

function getTaggedArticles(articles, tag) {
console.log(`Looking for articles with tag "${tag}"`);
  return articles.filter(function (article) {
    if (hasTag(article, tag)) {
    return true;
  }
  });
}

router.get('/:tag', function(req, res, next) {
  console.time('Query time');
  var queryTag = req.params.tag;
  getAllFilenames().then(getAllFiles).then(parseArticles).then(function (articles) {
    return getTaggedArticles(articles, queryTag);
  }).then(function (results) {
    var arr = results.toArray();
    console.log(`Got ${results.size()} results for tag "${queryTag}"`);
    console.timeEnd('Query time');
    res.render('tag', {articles: arr, queryTag: queryTag});
  });

});

module.exports = router;
