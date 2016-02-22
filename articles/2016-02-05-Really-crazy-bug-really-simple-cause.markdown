---
layout: post
title: Really crazy bug with really simple cause
description: A seemingly inexplicable exception when trying to render my articles, and what caused it.
date: 2016-02-05
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
- bugs
---
Started getting an inexplicable exception when trying to render the array of article objects as summaries via jade. At first I thought it was my sorting code, but that didn't seem to have caused the issue, so I had to uncomment all my debug console.log() statements, and read over the output line by line. Eventually I realised that some weird junk was being fed in as 'content' amongst all the rest of the articles – it looked almost like an article had been corrupted, or as if some other file was being read. Due to the joys of async filesystem calls, I didn't figure it out right away – and it didn't help that the culprit was a hidden file: turned out the problem was .DS_Store. Probably should have realised that was going to create problems sooner or later. After I wake up I need to see about modifying my `readFiles()`` function to ignore anything it finds that isn't an article, but a good start would be to ignore filenames beginning with a period.
