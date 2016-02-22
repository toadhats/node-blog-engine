---
layout: post
title: "Lessons learned regarding performance"
description: "It didn't take much of an improvement in my understanding to realise that the code I was so happy with last week was absolute garbage."
date: 2016-02-17
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
- performance
---
I heard back from the company I was writing this for, they said they were happy with what I had so far... but I wasn't. Before actually getting the tag cloud in, I ended up going down a series of nested spirals, and learned a great deal – or at least, I learned enough to realise that there were *a lot* of fundamental flaws in what I'd written.

For one, the code was hideous. While it could be deciphered, it looked far too messy and complex given it was performing such simple tasks. This is largely because I had used the most obvious (and primitive) patterns possible; I found myself in the lower circles of callback hell in my index generation function, and the ugliness only became more apparent when I started trying to adapt that function to create tag pages. After looking at different ways of handling these kinds of problems, I realised that the issue was that I was doing two messy tasks at once – handling nested iteration, as well as async returns. While I was correct in assuming that native JS for loops are the fastest way of doing any kind of iteration, they made for really longwinded and hard to read functions. After looking at ways to make minor improvements within that style (e.g. using named functions instead of anonymous ones, and declaring them outside the main function) I ended up diving straight into the deep end, and starting to use Lazy.js to write my iterative work in a functional style, and bluebird to start using promises instead of callbacks. As a result, I was able to write in 2 lines what would previously have taken me 20. A colossal improvement. I'm now going back and rewriting the old stuff in the same way. While using these libraries **is** slower than using native `for` loops, there was a much more serious issue performance wise that it took me far too long to fully realise.

The itch I had regarding performance within the app was totally justified, but I was looking at it in entirely the wrong way. Speeding up that loop was not my real issue – the fact that I am even performing that operation on every request is the real problem here. As I've learned from countless admonitions from SE commenters, I shouldn't worry about performance problems until I've quantified them, so I checked just how long it was taking to generate the index:
- Locally, average response time is 387ms
- On heroku, average response time is **703ms**

This is compared to like 20ms for loading an individual article when the server is running locally, and 100ms when running on heroku. In other words, I've got a real problem here.

After some soul searching and Stack Exchanging, I've come to the conclusion that I need to be caching this content, not rebuilding it on every request. While the app will be slightly less 'dynamic', I was totally wasting effort. This app is designed to host a single blog, not a whole network of blogs; the chance of a new article being uploaded between requests is very, very small, given how often your average blogger posts an article. After the redesign, the idea will be that the server parses all the article files on startup, and then rechecks the folder at an interval (30-60 minutes is probably reasonable) to get any updated content. I'd like to also include the option to force an update, probably via some kind of 'hidden' admin route, so that when a new article is written, it can be checked out right away to make sure everything looks good.

I'm actually starting to like the idea of this app, and I'm hoping to develop it into something I'll keep maintaining and improving; I'll probably use it to run a blog of my own. Rather than just being proof that I'm able to code to a rough specification, I think I'll work towards making this a very simple, easy to use and install engine, with the key features being that it parses markdown, so you can compose in your own editor; and reads from the filesystem, so you can get articles into there via more or less any means you like, depending on where the server is running. One thing I'm NOT going to do here is have any kind of upload functionality – the idea is to have an application where you don't have to worry too much about security etc because there's nothing to attack – precisely the kind of server I would want to operate myself. I'm not going to have any authentication, so I can't get it wrong and don't need to waste time maintaining a whole system for a single account. I'm not going to accept any kind of input except HTTP GET requests for pages, so I don't need to worry about anything malicious happening via that channel. On the flip side, it's still going to be a dynamic blog server, rather than a static site generator – there's plenty of static site generators out there, but it seems like they introduce slightly too many steps when all you want to do is put a bit of text on the internet.

Moving towards turning this from an interview exercise into a usable app, I need to do the following:

- Remove all copyrighted content, including the stylesheet
- Write some test articles to replace the current articles I'm using to test everything
- Create a mechanism for doing styling in some kind of frictionless/enjoyable way (e.g. expecting a css file with certain classes/properties in a particular place, nothing fancy)
- Create some tools to make it easy to write articles in the correct format (e.g. atom snippets)
