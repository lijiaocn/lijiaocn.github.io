#! /bin/sh
#
# run.sh
# Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
#
# Distributed under terms of the GPL license.
#

port=`cat port`
rm -rf /tmp/jekyll.log
nohup bundle exec jekyll serve --port $port --incremental --force_polling  2>&1 1 > /tmp/jekyll.log &
#nohup bundle exec jekyll serve --port $port  --force_polling 2>&1 1 > /tmp/jekyll.log &
#bundle exec jekyll serve --port $port  2>&1 
#bundle exec jekyll serve --port 4004 
