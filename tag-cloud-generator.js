"use strict";
var Lazy = require('lazy.js');

/*
Takes an array of article objects and returns an array of tag objects in JSON format for passing into tag-cloud.
Tag objects contain the tag name, and the number of instances (used to set size of tag when displayed)
Tag objects may need to be formatted as JSON if I'm using the tag-cloud module from NPM.
*/

module.exports = {

  // Takes an array of articles, returns an array of tags.
  getUniqueTags: function(articles) {
    var tags = Lazy(articles).pluck("attributes").pluck("tags").flatten().compact().sort().uniq();
    console.log("Pluck and sort tags :"); // debug
    return tags.toArray();
  },

  // Takes an array of articles, returns a Sequence of tag objects {tag: count}
  getTagsWithCount: function(articles) {
    var lazyArticles = Lazy(articles).compact(); // compact() MIGHT be enough to solve the problem? It's a start.
    if (lazyArticles.isEmpty()) {
      console.error("getTagsWithCount: Got an empty articles array!");
    } else if (lazyArticles.first().attributes === undefined) {
      console.error("getTagsWithCount: Attributes of first article are undefined!");
    } else if (lazyArticles.last().attributes === undefined) {
      console.error("getTagsWithCount: Attributes of last article are undefined!");
    }

    var tags = Lazy(articles).compact().pluck("attributes").pluck("tags").flatten().compact().sort().countBy();
    return tags; // returns a Lazy.js Sequence
  },

  // Formats a Sequence of tag objects into the specific kind of JSON array for spoonfeeding to fussy baby tag-cloud.js
  formatForTagCloud: function(tags) {
    var keysToJSON = tags.keys().map(function(x){return {"tagName": x, "count": tags.get(x)};}).toArray();
    var json = JSON.stringify(keysToJSON);
    return json;
  }

}; //end exports
