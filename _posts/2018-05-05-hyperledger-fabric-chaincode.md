---
layout: default
title:  "超级账本HyperLedger: Fabric Chaincode（智能合约、链码）开发方法"
author: 李佶澳
createdate: 2018/04/03 10:07:00
last_modified_at: 2018/07/29 13:04:26
categories: 项目
tags: HyperLedger
keywords: 超级账本,HyperLedger,Fabric,Chaincode,合约链码
description: "学习写一下chaincode,Hyperledger fabric的chaincode可以使用Go、Node.js、Java等语言开发"

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第一章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

Hyperledger fabric的chaincode可以使用Go、Node.js、Java等语言开发。Chaincode将在Peer节点上以容器的方式运行，实现与背书节点进程之间的隔离。这里讲解一下怎样用Go语言开发Chaincode。

{% include fabric_page_list.md %}

## Chaincode代码结构

chaincode的代码结构大体如下，直接调用shim.Start()启动chaincode：

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

然后需要做的就是为SimpleChaincode实现一些接口，其中`Init`和`Invoke`是约定好的，必须有的。

## 实现Init接口

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

通过Invoke接口，调用请求将被转发到Invoke，然后可以在这里将请求转发给不通的函数处理：

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

在Init和Invoke方法中，都有一个stub参数，通过这个参数可以做很多操作，例如读取数据、写入数据、查看提案等。

## shim.ChaincodeStubInterfac: 可以使用的ChainCode接口

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

## 读取传入参数

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

## 接下来...

合约的使用参考：[《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》][3]

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

## 参考

1. [chaincode interface][1]
2. [HyperledgerFabric的使用][2]
3. [《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》][3]
4. [HyperLedger Fabric ChainCode开发——shim.ChaincodeStubInterface用法][4]

[1]: https://github.com/hyperledger/fabric/blob/release-1.1/core/chaincode/shim/interfaces_stable.go  "chaincode interface" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html  "Hyperledger Fabric的使用" 
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/17/hyperledger-fabric-chaincodes-example.html "《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》"
[4]: https://www.cnblogs.com/studyzy/p/7360733.html "HyperLedger Fabric ChainCode开发——shim.ChaincodeStubInterface用法"
