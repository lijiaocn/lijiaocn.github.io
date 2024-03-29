#! /bin/sh
#
# push.sh
# Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
#
# Distributed under terms of the GPL license.
#

if [ $# == 0 ];then
	echo "usge: $0 path path..."
fi

for path in $*;do
	echo  $path
	pushd $path
		port=`cat port`
		echo $port
		pid=`ps aux|grep $port |grep -v "grep"|grep -v "$path"|awk '{print $2}'`
		echo "pid is $pid"
		kill -9 $pid

#		git checkout main
		git add .
		git commit -m "m"
		git pull
		git push
		
		bundle exec jekyll build
#		git checkout gh-pages
#		git pull
#		cp -rf _site/* .
#		git add .
#		git commit -m "m"
#		git pull
#		git push 
#	
#		git checkout main
#		./run.sh
	popd
done

