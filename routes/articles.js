"use strict";
var express = require('express');
var router = express.Router();
var path = require("path");
var fs = require('fs');
var fm = require('front-matter');
var moment = require('moment');
//var md = require('marked');


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

/* GET article */
router.get('/:URN', function(req, res, next) {
  var articleFilePath = path.join('articles', req.params.URN + '.markdown');
  //console.log("Attempting to read " + articleFilePath);
  fs.readFile(articleFilePath, function(err, content) {
    var article = processArticle(content);
    if (article) {
      res.render('articles', { article: article});
    } else {
      res.status(err.status || 500);
      res.render('error', {message: "Article not found. Sorry!", error: err });
    }
  });
});

module.exports = router;
