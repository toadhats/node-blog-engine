"use strict";
var Lazy = require('lazy.js');

/*
Takes an array of article objects and returns an array of tag objects in JSON format for passing into tag-cloud.
Tag objects contain the tag name, and the number of instances (used to set size of tag when displayed)
Tag object: {tag: 'javascript', count: 6}
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
    var tags = Lazy(articles).pluck("attributes").pluck("tags").flatten().compact().sort().countBy()
    return tags // returns a Lazy.js Sequence
  },

  // Formats a Sequence of tag objects into the specific kind of JSON array for spoonfeeding to fussy baby tag-cloud.js
  formatForTagCloud: function(tags) {
    // console.log(tags.keys().each(function(x){console.log(x);}));
    var keysToJSON = tags.keys().map(function(x){return {"tagName": x, "count": tags.get(x)};}).toArray();
    var json = JSON.stringify(keysToJSON);
    console.log(json);
    return json;
  }

}; //end exports
