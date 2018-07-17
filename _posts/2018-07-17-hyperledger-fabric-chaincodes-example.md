---
layout: default
title:  "超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示"
author: 李佶澳
createdate: 2018/07/17 10:20:00
changedate: 2018/07/17 10:45:17
categories: 项目
tags: HyperLedger
keywords: 超级账本,Fabric,HyperLedger Fabric,Chaincode,智能合约,链码
description: 超级账本HyperLedger Fabric的Chaincode的开发、使用

---

* auto-gen TOC:
{:toc}

## 说明

演示使用的合约代码都托管在在Github上：[合约代码][1]。

可以用下面的方式获取：
	
	mkdir -p $GOPATH/github.com/introclass
	cd $GOPATH/github.com/introclass
	git https://github.com/introclass/hyperledger-fabric-chaincodes.git

或者：

	go get github.com/introclass/hyperledger-fabric-chaincodes


## Example-1：demo

[example-1: demo][2]中演示了最基本、最常用的方法，可以通过这个合约进行下面操作：

	func (t *Chaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	    function, args := stub.GetFunctionAndParameters()
	    switch function {
	    //返回调用者信息
	    case "creator":
	        return t.creator(stub, args)
	    //调用改合约中的其它方法，用来演示复杂的调用
	    case "call":
	        return t.call(stub, args)
	    //直接对key的内容进行append，用来演示这样操作的结果
	    case "append":
	        return t.append(stub, args)
	    //读取当前用户的属性值
	    case "attr":
	        return t.attr(stub, args)
	    //查询一个key的当前值
	    case "query":
	        if len(args) != 1 {
	            return shim.Error("parametes's number is wrong")
	        }
	        return t.query(stub, args[0])
	    //查询一个key的所有历史值
	    case "history":
	        if len(args) != 1 {
	            return shim.Error("parametes's number is wrong")
	        }
	        return t.history(stub, args[0])
	    //创建一个key，并写入key的值
	    case "write": //写入
	        if len(args) != 2 {
	            return shim.Error("parametes's number is wrong")
	        }
	        return t.write(stub, args[0], args[1])
	    //通过当前合约，到另一个合约中进行查询
	    case "query_chaincode":
	        if len(args) != 2 {
	            return shim.Error("parametes's number is wrong")
	        }
	        return t.query_chaincode(stub, args[0], args[1])
	    //通过当前合约，到另一个合约中进行写入
	    case "write_chaincode":
	        if len(args) != 3 {
	            return shim.Error("parametes's number is wrong")
	        }
	        return t.write_chaincode(stub, args[0], args[1], args[2])
	    default:
	        return shim.Error("Invalid invoke function name.")
	    }
	}


## 参考

1. [演示使用的合约代码][1]
2. [example-1: demo][2]

[1]: https://github.com/introclass/hyperledger-fabric-chaincodes  "https://github.com/introclass/hyperledger-fabric-chaincodes" 
[2]: https://github.com/introclass/hyperledger-fabric-chaincodes/tree/master/demo "example-1: demo"
