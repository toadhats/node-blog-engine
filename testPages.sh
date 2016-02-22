#!/bin/zsh
for ((i = 1; i < 20; i++));
do
  curl node-blog-engine.herokuapp.com/page/$i;
  sleep 1;
done
