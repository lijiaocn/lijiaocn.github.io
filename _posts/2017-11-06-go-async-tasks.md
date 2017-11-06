---
layout: default
title: 分布式任务队列machinery的使用
author: lijiaocn
createdate: 2017/11/06 09:58:56
changedate: 2017/11/06 15:10:51
categories: 编程
tags: golang
keywords: golang,async task,分布式任务队列,machinery
description: 分布式任务队列是大型系统中经常用的技术方案，是一种高效、可靠性高，能够承受海量并发的技术方案。

---

* auto-gen TOC:
{:toc}

## 说明 

分布式任务队列是大型系统中经常用的技术方案，是一种高效、可靠性高，能够承受海量并发的技术方案。

目前有个名为[machinery][1]的开源项目，是用go语言开发了一个分布式任务框架。

学习代码位于[machinery study code][4]

## 快速体验machinery

machinery需要外部的broker和result backend。

### 依赖的服务

broker目前支持:

	amqp :    amqp://[username:password@]@host[:port]
	redis :   redis://[password@]host[port][/db_num]
	          redis+socket://[password@]/path/to/file.sock[:/db_num]

result backend目前支持:

	amqp :    amqp://[username:password@]@host[:port]
	redis :   redis://[password@]host[port][/db_num]
	          redis+socket://[password@]/path/to/file.sock[:/db_num]
	memcache: memcache://host1[:port1][,host2[:port2],...[,hostN[:portN]]]
	mongodb:  mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]

这里使用rabbitmq和redis，均部署在本地: [在mac上部署redis][2][在mac上部署rabbitmq][3]

### 运行example

直接用go get获取项目代码:

	go get github.com/RichardKnop/machinery/v1

在machinery项目目录下，有一个example目录，是一个使用示例。

启动worker:

	go run example/machinery.go worker

启动send:

	go run example/machinery.go send

## 开发worker

worker是用来执行任务的，worker启动的时候注册它能够承担的任务。

首先要创建一个server：

	var cnf = &config.Config{
		Broker:        "amqp://guest:guest@localhost:5672/",
		DefaultQueue:  "machinery_tasks",
		ResultBackend: "redis://127.0.0.1:6379",
		AMQP: &config.AMQPConfig{
			Exchange:     "machinery_exchange",
			ExchangeType: "direct",
			BindingKey:   "machinery_task",
		},
	}
	
	//init server
	server, err := machinery.NewServer(cnf)
	if err != nil {
		log.Fatal(err)
	}

在server中注册要承担的task：

	//regist task
	server.RegisterTask("HelloWorld", HelloWorld)

每个task都是一个函数，task函数返回的最后一个参数必须是error，例如：

	func HelloWorld(arg string) (string, error) {
		return "Hi, i'm worker@localhost", nil
	}

最后创建worker，并启动:

	//create worker
	worker := server.NewWorker("worker@localhost", 10)
	err = worker.Launch()
	if err != nil {
		log.Fatal(err)
	}

运行worker:

	$go run worker.go
	INFO: 2017/11/06 13:59:45 worker.go:31 Launching a worker with the following settings:
	INFO: 2017/11/06 13:59:45 worker.go:32 - Broker: amqp://guest:guest@localhost:5672/
	INFO: 2017/11/06 13:59:45 worker.go:33 - DefaultQueue: machinery_tasks
	INFO: 2017/11/06 13:59:45 worker.go:34 - ResultBackend: redis://127.0.0.1:6379
	INFO: 2017/11/06 13:59:45 worker.go:36 - AMQP: machinery_exchange
	INFO: 2017/11/06 13:59:45 worker.go:37   - Exchange: machinery_exchange
	INFO: 2017/11/06 13:59:45 worker.go:38   - ExchangeType: direct
	INFO: 2017/11/06 13:59:45 worker.go:39   - BindingKey: machinery_task
	INFO: 2017/11/06 13:59:45 worker.go:40   - PrefetchCount: 0
	INFO: 2017/11/06 13:59:45 amqp.go:72 [*] Waiting for messages. To exit press CTRL+C

## 开发Sender

发送端用来向worker发送任务。

发送端也需要像worker一样创建server，在server注册task，需要与worker保持一致。

	var cnf = &config.Config{
		Broker:        "amqp://guest:guest@localhost:5672/",
		DefaultQueue:  "machinery_tasks",
		ResultBackend: "redis://127.0.0.1:6379",
		AMQP: &config.AMQPConfig{
			Exchange:     "machinery_exchange",
			ExchangeType: "direct",
			BindingKey:   "machinery_task",
		},
	}
	
	//init server
	server, err := machinery.NewServer(cnf)
	if err != nil {
		log.Fatal(err)
	}
	
	//regist task
	server.RegisterTask("HelloWorld", HelloWorld)

sender要发送的每个task用`Signature`描述:

	type Signature struct {
	  UUID           string
	  Name           string
	  RoutingKey     string
	  ETA            *time.Time
	  GroupUUID      string
	  GroupTaskCount int
	  Args           []Arg
	  Headers        Headers
	  Immutable      bool
	  RetryCount     int
	  RetryTimeout   int
	  OnSuccess      []*Signature
	  OnError        []*Signature
	  ChordCallback  *Signature
	}

发送task——HelloWorld：

	//task signature
	signature := &tasks.Signature{
		Name: "HelloWorld",
		Args: []tasks.Arg{
			{
				Type:  "string",
				Value: "task1",
			},
		},
	}
	
	asyncResult, err := server.SendTask(signature)
	if err != nil {
		log.Fatal(err)
	}

等待任务执行的结果:

	res, err := asyncResult.Get(1)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%s\n", res)

## 编排Task

machinery支持task编排，即workflow，支持以下几种workflow：

	Group:     Group中的多个task并行的执行
	Chord:     Group中的任务都执行完成后，回调Chord中指定的task
	Chain:     所有的task串行执行，一个执行完成后，执行下一个

具体情况，参考[github: machinery][1]。

## 参考

1. [github: machinery][1]
2. [在mac上部署redis][2]
3. [在mac上部署rabbitmq][3]
4. [machinery study code][4]

[1]: https://github.com/RichardKnop/machinery  "github machinery" 
[2]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/11/06/mac-redis-server.html  "在mac上部署redis" 
[3]: http://www.lijiaocn.com/技巧/2017/11/06/mac-rabbitmq.html "在mac上部署rabbitmq"
[4]: https://github.com/lijiaocn/study-golang/tree/master/study/machinery  "machinery study code"
