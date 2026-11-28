---
title: "AI 开发工具升级（1）：Orca 使用体验"
tags: [独立赚钱]
---

* auto-gen TOC:
{:toc}

## 说明

之前公司资质、开发者账号、收款渠道等要啥没啥，积攒的一堆想法里没有几个值得做成产品的。
开发一个用于跑通上架和收款流程的应用，cursor 也够用，还没有封号/验证的麻烦事。

如今应用的发布上架等这些流程已经跑顺，适合自己的产品开发过程也基本理顺。
接下来要进行批量的需求挖掘以及快速推出验证版本，需要升级 AI 工具了。

大概看一下近期的分享文章，orca 提及频率很高，先看看 orca。

## Orca 的多 agent 

orca 的[入门介绍][2] 里展示的核心能力是：

**把相同的任务发送给多个 agent 执行，然后选择使用哪个 agent 的产出**。

入门文档里介绍的是手摇的操作方式，多 agent 产出对比需要这么操作：

* 先创建一个 project，关联到代码或者工作目录
* 在 project 中创建多个 worktree，自动创建对应 branch，人工指定使用的 agent
* 把任务提示词在每个 worktree 对话框里发送一遍，等待结果
* 对比所有 worktree 结果，选用其中一个

worktree 不是稀奇的用法，主流的 agent 都支持。
orca 的创新点在于它能同时驱动多个厂商的 agent，在一个软件中给不同厂商的 agent 下发任务，然后在一个软件里查看各个 agent 的产出，不需要在每家的 agent 之间来回切换。

创建多个 worktree，然后给它们发送同样的任务提示词：

![orca 的 worktree 列表]({{ site.img }}/orca-worktree-list.png)

worktree 需要的 branch 被自动创建：

![orca worktree 关联的branch]({{ site.img }}/orca-worktree-branch.png)

每个 worktree 有独立的窗口，对比产出的时候需要进入每个 worktree 查看：

![orca worktree 独立的 tab 组]({{ site.img }}/orca-worktree-tabs.png)

删除 worktree 就可以把不满意的 agent 产出清理干净，改动以及相应的 branch 都会清理：

![orca worktree delete]({{ site.img }}/orca-worktree-delete.png)

## Orca 的 Orchestration 

虽然 orca 的入门文档里使用的还是这种手动创建多个 worktree 的例子，但是显然易见的麻烦。

orca 还有一个实验阶段的 orchestration 功能，自动触发 worktree 的创建，以及更灵活安排 agent 之间的协作。
进入 setting 页面搜索 orchestration，安装过程就是在本地的 agent 对应目录中添加 orchestration skill。

之后可以在任何一个会话里用提示词触发编排：

![在会话用提示词触发编排]({{ site.img }}/orca-orch-prompt.png)

编排过程中创建的 worktree 挂在发起编排的 worktree 目录下：

![编排发起的 worktree]({{ site.img }}/orca-orch-worktree.png)

有了 orchestration，orca 的可玩性大大提高。

不同 agent 分别负责不同的工作，这可多个 agent 并发做同样的工作更有价值。

[1]: https://orca.dev/ "orca"
[2]: https://orca.dev/docs/first-session "orca: Your first 3-agent session"
