---
layout: post
title: Duplicate keys in YAML front matter
description: Duplicate keys are a pain to deal with. How do I decide between taking responsibility for them, versus making the user responsible for not including any?
date: 2016-02-03
author:
  name: Jonathan Warner
  mail: limule@icloud.com
  url: http://twitter.com/toadhats
  avatar: http://gravatar.com/avatar/5ce1bf1f895e26b6e2103b6aa3ecc076
tags:
- development
- YAML
- bugs
- dilemmas
---
I've been reading/thinking about this problem and based on [this issue](https://github.com/nodeca/js-yaml/issues/166) on the repo for js-yaml, the ideal solution is probably to fix the post files – YAML containing duplicate keys is not considered valid YAML, and throwing the exception is apparently the desired behaviour. I *could* mess around with the `front-matter` module and invoke the option on the js-yaml parse call which relaxes this restriction, but 1. It'd be an ugly hack and require maintaining my own version of front-matter for this project, and 2. overwriting duplicate keys *might* lead to unpredictable/undesirable results. While it does feel a little presumptuous to cast blame on the post files rather than finding a way to accomodate them as-is, given the YAML spec says there *MUST* not (vs. *should* not) exist duplicate keys, I feel it's a reasonable call to make. If I can find a graceful way to do it, I might compromise and see if I can get my app to at least not crash completely when it encounters the bad keys. I'm not sure I can automate the removal of the bad keys from the file (as I might need to choose which of the two duplicates I actually want to keep on a case by case basis)

Having gotten around that little problem, I'm not getting YAML exceptions any more, which revealed the fact that I've done something dumb regarding scoping of the array where I want to store/work with the articles. Javascript doesn't quite behave the way I want it to and so I think I'm going to have to spend the afternoon going deep into the nuts and bolts of scope in Javascript so I fully understand what I'm doing wrong, and what I should do instead. Alternatively, I could do what I've always done with Javascript in the past, and just move declarations around at random until everything magically works, but I'm tired of being in the dark on this issue and it's time to bite the bullet.
