#! /bin/sh
#
# push.sh
# Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
#
# Distributed under terms of the GPL license.
#

curl -H 'Content-Type:text/plain' --data-binary @urls.txt.md "http://data.zz.baidu.com/urls?appid=1584040578470474&token=EVFCmRqp1r3IDzBV&type=realtime" 
