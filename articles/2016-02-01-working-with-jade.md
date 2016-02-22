---
layout: post
title: "Working with Jade"
description: Getting a firm grasp on the Jade templating engine.
date: 2016-02-01
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
- jade
- markdown
---

I've spent the last couple of days trying to develop a comprehensive understanding of Jade, and unfortunately what I've come to understand is that it's not capable by itself of doing what I need it to do - namely rendering arbitrary markdown files as webpages on demand. Its inbuilt filters are compile-time only, meaning I can't pass markdown from the JS router (in turn from the markdown files in the directory) and have it translated to html. The solution (courtesy of this stack question) seems to be a javascript function which is itself capable of the conversion, passed with the render() call into Jade:

**Javascript:**

```
var md = require('marked');
res.render('view', { md:md, markdownContent:data });
```

**Then Jade:**

```
div!= md(markdownContent)
```
That's my biggest problem solved, so I could at least get my app to bare minimum functionality now. However, I still haven't succeeded in creating a template that really looks like a blog, and while that's a secondary/subsequent issue it's still bothering me a lot. I'd feel a lot more confident if I had an attractive template into which I can insert the text once I've got the processing/conversion pathway done, which is the opposite to the way I usually think. In the past I've always thought a lot more bottom-up, concerning myself with the "back end" before worrying about presentation, but as this is such a visual task I feel like my priorities have been reversed – I'm still enjoying the challenge, though.
