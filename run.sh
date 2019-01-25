#! /bin/sh
#
# run.sh
# Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
#
# Distributed under terms of the GPL license.
#

nohup bundle exec jekyll serve --port 4000 2>&1 1 > /tmp/jekyll.log &
#bundle exec jekyll serve --port 4004 
