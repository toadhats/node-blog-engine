---
layout: post
title: "Steady progess"
description: In which steady progress is made.
date:
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
- YAML
---
Had some solid breakthroughs last night and today – app is now parsing the article files, extracting metadata, and isolating the post body content. I'm using the node module `front-matter` to help with this – there are many YAML front matter parsers like it, but this one is mine. Well, not mine, but it had 60,000 downloads on NPM in the last month, which I would say is a fairly solid wisdom-of-crowds endorsement. The only problem I've encountered is that (at least) one of the blog files I've been provided has a duplicate key in the front matter, which causes a js-yaml exception. I'm going to work out what to do about that after dinner, in terms of handling such cases as gracefully as possible, although in a real implementation it feels like it would be reasonable to place the onus on the post author/user not to do something like that? That aside, I still need to work out how I'm going to present/style the content, both in terms of the list view and the individual article view. For the list view, I want something kind of like that `center-title-box` element, only with the content justified to the left (with some padding). I feel like everything I need is already in the templates somewhere, and I just need to have another sit down and experiment until I find the elements I want.
