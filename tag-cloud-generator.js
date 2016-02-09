"use strict";
var Lazy = require('lazy.js');

/*
Takes an array of article objects and returns an array of tag objects in JSON format for passing into tag-cloud.
Tag objects contain the tag name, and the number of instances (used to set size of tag when displayed)
Tag object: {tag: 'javascript', count: 6}
*/

module.exports = {

  getUniqueTags: function(articles) {
    var tags = Lazy(articles).pluck("attributes").pluck("tags").flatten().compact().sort().uniq(); // Got all the individual tags out of the articles.
    console.log("Pluck and sort tags :"); // debug
    tags.each(function(x){console.log(x);}); //debug
  }

}; //end exports
