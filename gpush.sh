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

		git add .
		git commit -m "m"
		git pull
		gitbook build
		git pull
		git push
		
		git checkout gh-pages
		git pull
		cp -rf _book/* .
		git add .
		git commit -m "m"
		git push 
		
		git checkout master
		#./run.sh
	popd
done

