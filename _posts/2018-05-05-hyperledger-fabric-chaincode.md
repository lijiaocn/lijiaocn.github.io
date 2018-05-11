---
layout: default
title:  超级账本Hyperledger fabric的chaincode开发
author: lijiaocn
createdate: 2018/04/03 10:07:00
changedate: 2018/05/11 20:23:18
categories: 项目
tags: HyperLedger
keywords: 超级账本,HyperLedger,Fabric,Chaincode,合约链码
description: 学习写一下chaincode

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程汇总：HyperLedger Fabric的视频讲解--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm)

文档正在完善中...

Hyperledger fabric的chaincode可以使用Go、Node.js、Java等语言开发。

Chaincode将会在一个独立的docker容器中运行，实现与背书节点进程之间的隔离。

这里以用Go语言开发Chaincode为例。

## ChainCode 接口

接口在["github.com/hyperledger/fabric/core/chaincode/shim"][1]中的ChaincodeStubInterface中定义。

	ChaincodeStubInterface : interface
	    [methods]
	   +CreateCompositeKey(objectType string, attributes []string) : string, error
	   +DelState(key string) : error
	   +GetArgs() : [][]byte
	   +GetArgsSlice() : []byte, error
	   +GetBinding() : []byte, error
	   +GetChannelID() : string
	   +GetCreator() : []byte, error
	   +GetDecorations() : map[string][]byte
	   +GetFunctionAndParameters() : string, []string
	   +GetHistoryForKey(key string) : HistoryQueryIteratorInterface, error
	   +GetQueryResult(query string) : StateQueryIteratorInterface, error
	   +GetSignedProposal() : *pb.SignedProposal, error
	   +GetState(key string) : []byte, error
	   +GetStateByPartialCompositeKey(objectType string, keys []string) : StateQueryIteratorInterface, error
	   +GetStateByRange(startKey, endKey string) : StateQueryIteratorInterface, error
	   +GetStringArgs() : []string
	   +GetTransient() : map[string][]byte, error
	   +GetTxID() : string
	   +GetTxTimestamp() : *timestamp.Timestamp, error
	   +InvokeChaincode(chaincodeName string, args [][]byte, channel string) : pb.Response
	   +PutState(key string, value []byte) : error
	   +SetEvent(name string, payload []byte) : error
	   +SplitCompositeKey(compositeKey string) : string, []string, error

## chaincode代码结构

chaincode的代码结构大体如下，直接调用shim.Start()启动chaincode，传入的结构是chaincode的数据。

	package main
	
	import (
		"github.com/hyperledger/fabric/core/chaincode/shim"
	)
	
	// SimpleChaincode example simple Chaincode implementation
	type SimpleChaincode struct {
	}
	
	func main() {
		err := shim.Start(new(SimpleChaincode))
		if err != nil {
			fmt.Printf("Error starting Simple chaincode: %s", err)
		}
	}

## 实现Init接口

chaincode部署到fabric中以后，这些方法可以通过fabic的peer结点进行调用。

首先增加一个Init方法，这个方法将在chaincode初始化的时候调用，用来初始化chaincode。

	func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
		fmt.Println("ex02 Init")
		_, args := stub.GetFunctionAndParameters()

		var A, B string    // Entities
		var Aval, Bval int // Asset holdings
		var err error

		if len(args) != 4 {
			return shim.Error("Incorrect number of arguments. Expecting 4")
		}

		// Initialize the chaincode
		A = args[0]
		Aval, err = strconv.Atoi(args[1])
		if err != nil {
			return shim.Error("Expecting integer value for asset holding")
		}
		B = args[2]
		Bval, err = strconv.Atoi(args[3])
		if err != nil {
			return shim.Error("Expecting integer value for asset holding")
		}
		fmt.Printf("Aval = %d, Bval = %d\n", Aval, Bval)

		// Write the state to the ledger
		err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
		if err != nil {
			return shim.Error(err.Error())
		}

		err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
		if err != nil {
			return shim.Error(err.Error())
		}

		return shim.Success(nil)
	}

## 实现Invoke接口

通过Invoke接口，将调用请求转发给具体的方法。

	func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	    fmt.Println("ex02 Invoke")
	    function, args := stub.GetFunctionAndParameters()
	    if function == "invoke" {
	        // Make payment of X units from A to B
	        return t.invoke(stub, args)
	    } else if function == "delete" {
	        // Deletes an entity from its state
	        return t.delete(stub, args)
	    } else if function == "query" {
	        // the old "Query" is now implemtned in invoke
	        return t.query(stub, args)
	    }
	
	    return shim.Error("Invalid invoke function name. Expecting \"invoke\" \"delete\" \"query\"")
	}

## 获取传入参数

传入参数通过`stub.GetFunctionAndParameters()`获取，得到的是一个数组，记录了所有传入参数。

	func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
		function, args := stub.GetFunctionAndParameters()
		..
		if len(args) != 4 {
			return shim.Error("Incorrect number of arguments. Expecting 4")
		}

		// Initialize the chaincode
		A = args[0]
		...
		}

## 写入账本

使用`stub.PutState()`方法以`key-value`的方式将数据写入账本：

	//A:="a"
	err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return shim.Error(err.Error())
	}

	//B:="a"
	err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return shim.Error(err.Error())
	}

## 查询账本

使用`stub.GetState()`方法查询区块：

	//A:="a"
	Avalbytes, err := stub.GetState(A)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
		return shim.Error(jsonResp)
	}

## 返回值

使用`stub.Success()`或者`stub.Error()`将数据返回给调用者：

	func Success(payload []byte) pb.Response {
		return pb.Response{
			Status:  OK,
			Payload: payload,
		}
	}
	
	func Error(msg string) pb.Response {
		return pb.Response{
			Status:  ERROR,
			Message: msg,
		}
	}

## 并发问题

[Hyperledger Fabric and how it isn’t concurrent out of the box.][3]

[How hyperledger handle the Concurrent of “invoke” of the same Key-Value pair of chaincode?][4]

![区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [chaincode interface][1]
2. [HyperledgerFabric的使用][2]
3. [Hyperledger Fabric and how it isn’t concurrent out of the box.][3]
4. [How hyperledger handle the Concurrent of “invoke” of the same Key-Value pair of chaincode?][4]

[1]: https://github.com/hyperledger/fabric/blob/release-1.1/core/chaincode/shim/interfaces_stable.go  "chaincode interface" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html  "Hyperledger Fabric的使用" 
[3]: https://medium.com/wearetheledger/hyperledger-fabric-concurrency-really-eccd901e4040 "Hyperledger Fabric and how it isn’t concurrent out of the box"
[4]: https://stackoverflow.com/questions/37691994/how-hyperledger-handle-the-concurrent-of-invoke-of-the-same-key-value-pair-of?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa  "How hyperledger handle the Concurrent of “invoke” of the same Key-Value pair of chaincode?"
