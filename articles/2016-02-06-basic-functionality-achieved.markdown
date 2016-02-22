---
layout: post
title: "Basic functionality achieved"
description: "Well, it does more or less what it was supposed to. Now to squash all the bugs..."
date:
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
---
Today I got the app to the point that it actually does what it's supposed to do: list all the articles and serve them up. Now it's just a matter of bugfixing/polishing/optimising/adding features. The first feature I need to add is pagination, which as always I've managed to overthink and overcomplicate.

The thing is, because the files aren't guaranteed to be ordered properly in the directory (as far as I can tell) I've been having to load them all to sort them anyway. But loading all of them and then only showing a subset of them (based on which page I'm on) kind of feels like wasted work/time. The simplest approach, and the one I'm going to implement first, is just to do an Array.slice() right before sending the array to the jade template. It's not very elegant, but it should work. I don't think I can really do it any earlier than after I've already sorted the array so it won't be any faster than loading them all, although it MIGHT save some time on the Jade side.
