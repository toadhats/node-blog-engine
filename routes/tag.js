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

// As per the new way of building the index, used module-scoped variables to cache as much of this work as possible.
// Then we're not doing O(n^2) operations every time a user requests a particular tag
// I feel like this is the quintessential case for a time-memory tradeoff

// Returns a promise containing all the filenames in the articles dir
var getAllFilenames = function () {
    return fs.readdirAsync(articlesPath);
};

var getArticleContent = function (filename) {
    return fs.readFileAsync(articlesPath + "/" + filename, "utf8");
};

// Trying some real craziness here...
function getTaggedArticles(tag) {
  // Create a sequence which is the result of a horrific arrangement of nested promise garbage
  var results = Lazy(getAllFilenames().then(function(filenames) {return filenames;}));

}
