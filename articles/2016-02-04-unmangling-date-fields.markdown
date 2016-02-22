---
layout: post
title: Unmangling the date fields
description: In which we discover more inconsistencies in the test articles I was given, and agonise whether to adapt to the existing content, or declare it incompatible with my grand vision and twist it until it fits.
date: 2016-02-04
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
- dilemmas
- momentJS
---
Since the async readFile calls meant the articles were being stored in memory in the wrong order, I knew I'd have to sort them for display. Because the files are presumably able to be processed by Jekyll as-is, I had hoped I'd get away with just sorting them as strings (which I incorrectly assumed would work for YYYY-MM-DD order), but that's not the case. Partly because I was wrong (the time components wouldn't sort properly), and secondly because the date attributes aren't consistent. Some are in quotes, some aren't; at least one article is in 12hr time while the rest are in 24hr; and some values have leading zeroes while others don't. I think I'm going to need to carefully create my own date processing function to catch all the edge cases and turn all the dates into consistent javascript Date types before I can correctly sort them – this will also allow me to ensure that they're all displayed consistently.

**Update:** Looks like moment.js should be able to fix this for me easily. Fingers crossed.

**Another update:** Moment.js is magic. It must be what is being used behind the scenes on the actual Auth0 blog server, because it handles all the inconsistent formats just fine.
