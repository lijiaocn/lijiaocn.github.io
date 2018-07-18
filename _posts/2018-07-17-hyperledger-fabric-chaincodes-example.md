---
layout: default
title:  "超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示"
author: 李佶澳
createdate: 2018/07/17 10:20:00
changedate: 2018/07/18 14:02:43
categories: 项目
tags: HyperLedger
keywords: 超级账本,Fabric,HyperLedger Fabric,Chaincode,智能合约,链码
description: 超级账本HyperLedger Fabric的Chaincode的开发、使用

---

* auto-gen TOC:
{:toc}

## 说明

演示使用的合约代码都托管在在Github上：[合约代码][1]。

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

完整代码： [合约代码][1]。

### 合约安装&单合约调用

#### 获取合约代码

可以用下面的方式获取合约源代码：

	mkdir -p $GOPATH/github.com/introclass
	cd $GOPATH/github.com/introclass
	git https://github.com/introclass/hyperledger-fabric-chaincodes.git

或者：

	go get github.com/introclass/hyperledger-fabric-chaincodes

#### 安装合约&初始化

安装合约：

	cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer0.member1.example.com
	 ./3_install_chaincode.sh

合约初始化：

	./4_instantiate_chaincode.sh

到另一个Peer上再安装一次合约：

	cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer1.member1.example.com/
	./3_install_chaincode.sh
	<不需要再次实例化>

#### 合约直接调用

下面的操作可以在任意一个Peer进行。

查看当前调用者，调用creator方法：

	$ ./peer.sh chaincode query -C mychannel -n mycc -c  '{"Args":["creator"]}'
	2018-07-18 12:45:48.083 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 12:45:48.083 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result:
	peers.member1.example.com�-----BEGIN CERTIFICATE-----
	MIICIjCCAcmgAwIBAgIRANQT46AE7SALHhoFnvodmiowCgYIKoZIzj0EAwIweTEL
	MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
	cmFuY2lzY28xHDAaBgNVBAoTE21lbWJlcjEuZXhhbXBsZS5jb20xHzAdBgNVBAMT
	FmNhLm1lbWJlcjEuZXhhbXBsZS5jb20wHhcNMTgwNzE1MDcwMzIzWhcNMjgwNzEy
	MDcwMzIzWjBeMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQG
	A1UEBxMNU2FuIEZyYW5jaXNjbzEiMCAGA1UEAwwZQWRtaW5AbWVtYmVyMS5leGFt
	cGxlLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABDMq5zAdcQgGWklQMdTf
	irdHhbTBsLALJ0hjKFfaLIRyKO7Bq39HFrxPybLc/d4PXDXXrQsS9HCnKj9PSO6u
	DBSjTTBLMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKA
	IIPK7RfYFuMcuUQahKin2FxuaskfZl3WWtCMmEhN06lMMAoGCCqGSM49BAMCA0cA
	MEQCIBnA0dhz/AnvsjNoWEuNBWIxRgKpG9CHbScrbQ7U9WK+AiAaZ4Qi7OZd8zev
	ZZUxizW00+GqDXJWJ9VX6edtKDNVFw==
	-----END CERTIFICATE-----
	
	2018-07-18 12:45:48.087 CST [main] main -> INFO 003 Exiting.....

写入Key:

	$ ./peer.sh  chaincode invoke -o orderer0.member1.example.com:7050 --tls true --cafile tlsca.member1.example.com-cert.pem -C mychannel -n mycc -c '{"Args":["write","key","keyvalue"]}'
	2018-07-18 12:48:30.728 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 12:48:30.728 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	2018-07-18 12:48:30.775 CST [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 003 Chaincode invoke successful. result: status:200
	2018-07-18 12:48:30.775 CST [main] main -> INFO 004 Exiting.....

查询刚写入的key:

	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["query","key"]}'
	2018-07-18 12:49:14.464 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 12:49:14.464 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: keyvalue    <-- 查询的结果
	2018-07-18 12:49:14.468 CST [main] main -> INFO 003 Exiting.....

更改key的值:

	$ ./peer.sh  chaincode invoke -o orderer0.member1.example.com:7050 --tls true --cafile tlsca.member1.example.com-cert.pem -C mychannel -n mycc -c '{"Args":["write","key","keyvalue1"]}'
	2018-07-18 12:50:44.023 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 12:50:44.023 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	2018-07-18 12:50:44.027 CST [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 003 Chaincode invoke successful. result: status:200
	2018-07-18 12:50:44.028 CST [main] main -> INFO 004 Exiting.....

查询key的历史数据：

	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["history","key"]}'
	2018-07-18 12:52:25.332 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 12:52:25.332 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: {"93ea6b185bb886c70f66b8b0dc8f5c727043269e2b7b7e76ae36644cd8ef3916":"keyvalue","f87a0f6f972226a57ade04a8e54db1a014d12cbab40abcbd8a5d65fe10bdfeff":"keyvalue1"}
	<可以看到历史值有两个>
	2018-07-18 12:52:25.340 CST [main] main -> INFO 003 Exiting.....

### 并发或快速修改数据时需要注意的问题

合约中的append方法的用是，读取一个key的value，然后在读取出来的数值上修改，最后重新写入账本。

需要特别注意，这种做法是有问题的，例如下面脚本预期的最终结果是["1","2","3","4","5","6","7","8","9","10"]：

	for i in {1..10}
	do
	    echo $i
	    sleep 1
	    ./peer.sh chaincode invoke -o orderer0.member1.example.com:7050 --tls true --cafile tlsca.member1.example.com-cert.pem -C mychannel -n mycc -c "{\"Args\":[\"append\",\"key-array\",\"$i\"]}"
	done

但执行结束后，得到的结果却是：

	./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["query","key-array"]}'
	2018-07-18 13:28:35.996 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:28:35.997 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: ["1","3","5","7","9"]
	2018-07-18 13:28:36.001 CST [main] main -> INFO 003 Exiting.....

查看历史价值，发现也有很多缺失的数据：

	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["history","key-array"]}'
	2018-07-18 13:28:44.773 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:28:44.773 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: {
		"2bace9ac4812416969f623a471e902ecb6198bc9d16c1ca1e7e9586adf6cd428":"[\"1\",\"3\",\"5\",\"7\",\"9\"]",
		"6832ef710f74a39bc08e3386d0eb8aa757cb53ccd7fe149b042417b5cc436750":"[\"1\",\"3\",\"5\"]",
		"8c041cd53f045999dc41ca1facb8dbce8acb4a07ff5dd558a53f8f2908789b3d":"[\"1\"]",
		"d1b68113730f0bb8adb9a19c64594e64729b4a1c1aa81a412edd6b1b1ad84e06":"[\"1\",\"3\"]",
		"d5fe258cc64d5f10f63b8a9f3c1d321d966f4d5c45b17b5b8c31eccad231e3fd":"[\"1\",\"3\",\"5\",\"7\"]"}
	2018-07-18 13:28:44.777 CST [main] main -> INFO 003 Exiting.....

出现这种结果的原因是，其中一些append操作是基于“旧”的数据的：之前的append操作依旧修改了数据，但是当前的append还不能查询到最新的数据。

这些append操作不会被接受。

如果只“修改”数据，则会是另一种结果：

	for i in {1..10}
	do
	    ./peer.sh  chaincode invoke -o orderer0.member1.example.com:7050 --tls true --cafile tlsca.member1.example.com-cert.pem -C mychannel -n mycc -c "{\"Args\":[\"write\",\"key-single\",\"$i\"]}"
	done

执行以后查询当前值，为10：

	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["query","key-single"]}'
	2018-07-18 13:41:45.257 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:41:45.257 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: 10
	2018-07-18 13:41:45.261 CST [main] main -> INFO 003 Exiting.....

但可以在历史数据中找到所有的值：

	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["history","key-single"]}'
	2018-07-18 13:42:47.206 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:42:47.206 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: {
		"0b6e46b6397ad2e76b2de842f162d558ce88b2409656d16a30b9f53f6a038357":"6",
		"1015deb1cdfd3e08a5da2fd03ddeb0e1df69287d88c017f7d55678405fbac774":"8",
		"5291a41b310b31b14b5b96c981dc9a6923ed4c956b52ee4e662fc65167531435":"3",
		"691678195fd7fbd7787ff6fb128adff87c34de9c96e62b599320d8c1966a8397":"7",
		"876374f0551eb227351f5312ca494d141cdddae99e7d67ffeffdd0094e5532bb":"1",
		"8b02dae72f1d6f9a4db6e2daa4947be1d5bcdbfa4f4fbb7a69382cc85510732b":"4",
		"b5c89bacda118d0e0a7777aad8083c1920ac90201e3dac0e8df6385038afee5c":"10",
		"de111d7b19b68918502a52d36f49fbd17a18db46a69379d3566f8d0531307871":"2",
		"e2dbb13a5d42c33756341f487357a526e669ca5fbdefd7e49026f12e3979889c":"5",
		"eb802055364096703b351cea60c0392119c487b0ab3a9cd6ed344ee897b6fa1a":"9"}
	2018-07-18 13:42:47.210 CST [main] main -> INFO 003 Exiting.....

### 合约链式调用

就是通过当前合约，调用另一个合约。

demo合约中提供了一个call方法，可以很方便的测试合约链式调用：

	["call","chaincode","method"...]   通过demo合约调用另一个合约

例如再部署一个叫做mycc2的合约，也使用demo的源代码，部署的合约名不同。

通过mycc调用mycc2的query：

	在mycc2中查询不到通过mycc写入的数据
	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["call","mycc2","query","key-single"]}'
	2018-07-18 13:53:15.680 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:53:15.680 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result:
	2018-07-18 13:53:15.774 CST [main] main -> INFO 003 Exiting.....
	
	直接调用mycc2也是一样查不到
	$ ./peer.sh chaincode query -C mychannel -n mycc2 -c '{"Args":["query","key-single"]}'
	2018-07-18 13:55:23.315 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:55:23.315 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result:
	2018-07-18 13:55:23.327 CST [main] main -> INFO 003 Exiting.....
	
	在mycc中可以查到
	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["query","key-single"]}'
	2018-07-18 13:53:31.077 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:53:31.077 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: 10
	2018-07-18 13:53:31.082 CST [main] main -> INFO 003 Exiting.....

如果用query方式调用另一个合约的invoke是无效的：

	在mycc2中写入key
	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["call","mycc2","write","key-single","inmycc2"]}'
	2018-07-18 13:59:25.610 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:59:25.610 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result:
	2018-07-18 13:59:25.615 CST [main] main -> INFO 003 Exiting.....
	
	无效，查询不到key
	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["call","mycc2","query","key-single"]}'
	2018-07-18 13:59:15.796 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:59:15.796 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result:
	2018-07-18 13:59:15.802 CST [main] main -> INFO 003 Exiting.....

如果用invoke方式调用另一个合约的invoke是有效的：

	$ ./peer.sh  chaincode invoke -o orderer0.member1.example.com:7050 --tls true --cafile tlsca.member1.example.com-cert.pem -C mychannel -n mycc -c '{"Args":["call","mycc2","write","key-single","inmycc2"]}'
	2018-07-18 13:59:48.432 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:59:48.432 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	2018-07-18 13:59:48.439 CST [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 003 Chaincode invoke successful. result: status:200
	2018-07-18 13:59:48.440 CST [main] main -> INFO 004 Exiting.....
	
	可以查询到
	$ ./peer.sh chaincode query -C mychannel -n mycc -c '{"Args":["call","mycc2","query","key-single"]}'
	2018-07-18 13:59:55.470 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
	2018-07-18 13:59:55.470 CST [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
	Query Result: inmycc2
	2018-07-18 13:59:55.476 CST [main] main -> INFO 003 Exiting.....

## 参考

1. [演示使用的合约代码][1]
2. [example-1: demo][2]

[1]: https://github.com/introclass/hyperledger-fabric-chaincodes  "https://github.com/introclass/hyperledger-fabric-chaincodes" 
[2]: https://github.com/introclass/hyperledger-fabric-chaincodes/tree/master/demo "example-1: demo"
