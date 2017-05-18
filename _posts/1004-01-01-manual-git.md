---
layout: default
title: Git使用手册
author: lijiaocn
createdate: 2017/04/01 11:00:33
changedate: 2017/05/15 18:35:28
categories: 手册
tags: git
keywords: git
description: git的使用手册，常用的协作方法，和一些非常有用的小技巧。

---

* auto-gen TOC:
{:toc}

## 摘要

Git的操作经常忘记, 这里记录下常用的操作。

## 设置代理

有一些项目使用了自己的git服务器，因为“墙”的存在，从国内访问这些git服务的时候，需要通过能够翻墙的代理。

可以设置为全局的：

	git config --global http.proxy 127.0.0.1:49710
	git config --global https.proxy 127.0.0.1:49710
	git config --global http.sslverify false 

git的全局配置文件是`~/.gitconfig`:

	[http]
		proxy = 127.0.0.1:49710
		sslverify = false
	[https]
		proxy = 127.0.0.1:49710

不需要代理的时候，可以用#号注释掉。

将repo获取到以后，可以在repo里设置local config，只在当前repo中使用代理:

	git config --local http.proxy 127.0.0.1:49710
	git config --local https.proxy 127.0.0.1:49710
	git config --local http.sslverify false 

## Github协作

在github上fork目标项目

将fork到自己账户中项目clone到本地

添加上游代码：

	git remote add upstream  https://github.com/kubernetes/kubernetes
	
	(upstream是自定义的名称)

在本地的开发分支上完成修改和commit。见“在分支中开发”一节中的1～7

更新上游代码:

	git remote update upstream

将本地分支设置为基于最新的上游分支的修改：

	git rebase upstream/master  (将当前所在分支的设置为基于最新的upstream/master)
	
	git rebase upstream/branchX  branchL  (将本地branchL分支的修改设置为基于最新的upstream/branchX) 

将本地的修改提交到自己的repo中

在github上发起pull request

## 在分支中开发

获取master代码:

	git checkout master

本地创建开发分支:

	git checkout -b dev-branch

提交开发分支中的内容:

	git add .
	
	git status
	
	git commit --verbose  
	
	(注意：切换到其它的分支之前一定要先commit,否则其它分支中的内容会受影响。)
	
	合并commit的方法见“合并commit”一节, 将本次的commit合并到上一次commit，可以使用“--amend”选项

将本地分支推送到远程：

	git push origin local_branch:remote_branch  
	
	如果remote_branch不存在，则新建
	如果local_branch为空，则删除remote_branch

拉取远程分支:

	git checkout -b 本地分支名 -t 远程分支名   

 更新本地的master:

	git fetch origin

 将本地开发分支的内容设置为基于更新后的master的修改:

	git rebase master dev-branch

 如果分支是基于另一个分支的，将其修改为基于master分支:

	git rebase -onto master  anotherbranch  currunbranch

在master中合并已经做过rebase的分支

	git merge dev-branch

在master中完成commit、push

	git add .
	
	git status
	
	git commit
	
	git push

推送tag

	git tag v0.0.X
	
	git push origin v0.0.X

删除开发分支

	git branch -d dev-branch
	
	git push origin :dev-branch    (如果开发分支远程仓库中也存在)

## 合并commit

从log中找到一个在要合并的分支之前的commit(ffe)

在rebase中设置要合并的commit

	git rebase -i ffe

编辑界面如下(将7143, 2a7c合并到ffe39):

	 pick ffe398c d1
	
	 s 2a7ccaa d2+d3
	
	 s 714ef1b d4 amend

越靠前的commit越老, 将一个commit前面的pick修改为s, 表示这个commit将和它前面的commit合并为一个commit

保存、推出编辑后，如果存在合并的commit，会立即弹出问本次合并填写注释的编辑窗口,编写新的注释后推出即可

退出注释编辑窗口后，ffe,2a7,714消失, 被一个新的commit取代。

## 回退

git reset:

	git reset --soft:   只将HEAD移动到指定的commit, 不会改动index文件和工作目录
	
	git reset --mixed 或者 git reset:   index文件回退到指定的commit, 不改动工作目录
	
	git reset --hard:  index文件和工作目录都回退到指定的commit

## 查看/拉取远程分支

查看:

	git branch -r 

拉取远程分支:

	git checkout -b 本地分支名 -t 远程分支名

## 推送tag

	git push origin TagName
	
	git push origin --tags    //push全部tag

## 删除tag

	git push origin :TagName  //删除远程tag

	git tag -d TagName        //删除本地tag

## 永久删除

[https://help.github.com/articles/remove-sensitive-data/](https://help.github.com/articles/remove-sensitive-data/)

[http://zpz.name/2287/](http://zpz.name/2287/)

	git filter-branch --index-filter 'git rm -r --cached --ignore-unmatch path/to/your/file' HEAD
	git push origin master --force
	rm -rf .git/refs/original/
	git reflog expire --expire=now --all
	git gc --prune=now
	git gc --aggressive --prune=now''

## 配置编辑器

	git config --global core.editor vim

## 有用的小方法

### 中文名乱码

解决中文文件名显示乱码：

	git config core.quotepath false
