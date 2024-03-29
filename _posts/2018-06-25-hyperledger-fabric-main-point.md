---
layout: default
title:  "超级账本HyperLedger: Fabric掰开揉碎，一文解惑 "
author: 李佶澳
createdate: 2018/06/25 07:53:00
last_modified_at: 2018/07/16 10:20:14
categories: 项目
tags: HyperLedger
keywords: HyperLedger,fabric,疑惑,fabri-ca,msp结构说明
description: 这篇文章适合对超级账本的明星项目Fabric有一定了解，同时内心充满了无数疑惑的朋友。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

原文发布在微信公众号“ **我的网课** ”： [超级账本HyperLedger Fabric，掰开揉碎，一文解惑][1]。

把事情搞清楚，并讲清楚，是一种难得的能力。虽然，需要的仅仅是对“常识”的把握，和永不停滞的思索、求证。这篇文章适合对超级账本的明星项目Fabric有一定了解，同时内心充满了无数疑惑的朋友。Fabric与HyperLedger的关系，见[《超级账本HyperLedger旗下项目介绍》][2]。

主要内容分为五个章节：目标、结构、合约、MSP、配置

{% include fabric_page_list.md %}

## 目标


搞清楚了目标，就理解了一大半，因为剩下的是无差别的体力劳动。


Fabric的主打卖点是：


    在permissioned networks上，进行private confidential transactions。


permissioned networks，这是与提倡“匿名”的公链显著不同的地方。


Fabric的定位是商业应用、是企业与企业之间的联盟链。联盟链是不能随随便便接入的，必须有准入限制（permissioned）。


可以与比特币网络进行对比。比特币的网络是全公开的网络，任何人都可以接入。


只需要下载一个实现了比特币网络协议的钱包，就可以进入到比特币网络中。没有人能够禁止你的加入，并且没有人知道你是谁（特殊手段除外）。


对于联盟链、对于企业来说，这显然是不能接受的。经营实业最需要的是“稳”，需要的是长期、稳定的生意伙伴。每个企业的生意网是不会对所有人无差别开放的。


Fabric中，所有的参与者都是得到批准的、实名的。当然这里的实名不是具体的名字，而是指身份可知。如何批准？我们在后面MSP一章中说明。


除此之外，Fabric支持private confidential transactions。


两个企业之间，以怎样的价格，做成了一笔什么样的交易。这是非常重要的商业机密，是绝对不能公开的。对竞争对手，更是要严密封锁。


所以，信息的扩散范围必须是可控的。




## 结构


解惑之前，还是要先解说一下Fabric的结构。毕竟看到此文的人，未必都有Fabric的使用经验。


组件只有两个：Peer和Orderer，它们就是两个二进制程序。


每个参与方可以选择部署一个/多个Peer，或者一个/多个Orderer，或者两个都部署。所有参与方的Peer/Orderer，彼此通信、连接，就组成了Fabric网络。


每个Peer中都存放全量的数据（账本），也就是完整的链（必须是Peer参与的链，见后面“控制信息的传播范围”）。


因为Peer中存放的是全量数据，因此每个参与者只需要从自己的Peer查询数据。为了防止舞弊，甚至于只有从自己的Peer上查询出同样的数据后，才能开始履行现实世界中的职责。（这个价值你懂了吗？）


网络中存在着数不清的Peer，每个Peer都存放全量的数据，那么怎样保证每个Peer存放的数据是正确的呢？


Fabric中，通过Orderer之间的协商，确保每个Peer都能收到正确的数据。


在使用Fabric的时候，有一个小细节，不知道你是否注意到：


    执行“查询（query）”操作，也就是调用合约中“没有写操作”的接口的时候，只需要指定Peer的地址。调用会执行“写操作”的接口时，还需要另外指定Orderer的地址。


Fabric中，Orderer是用来形成共识的。讨论起区块链，所有人都会谈“共识”，那么什么是“共识”？共识就是系统中所有节点都做出了同样的选择。


写操作都会被提交到Orderer，这个写操作要不要接受，如果有多个写操作，那么谁先谁后，网络中的所有Orderer需要形成共识，并将最终的结论通知给Peer。


“共识”的形成是一个比较大话题了，1975年的时候，就已经有了对“两将军问题”的研究。这里就不展开了，这样的话题，还是交给整天与符号打交道的怪才们吧。


作为身体力行的“实践者”、“工程人员”，更关注的是所有环节之间的连贯。例如：Orderer们形成的共识是如何送达Peer的？


Fabric中有一组特殊的链，叫做“system chain”。这组链相当于整个Fabric网络的配置文件，里面记录了所有的Channel信息、参与者的信息。（每个Channel对应一条system chain）


    部署Fabric时使用的创世块，就是system chain中的第一个区块。


每个参与者可以将自己的一个Peer地址写入到system chain中，这样的Peer被称为“锚点”（Anchor Peer）。Orderer们从system chain中获得Anchor Peer的地址，并将形成的共识通知给它们。

之后Anchor Peer通过Gossip协议，将结论八卦给其它的Peer。

>更正：这里的描述不恰当，Orderer是将共识发送给每个组织的Leader Peer，Leader Peer是一个组织的多个Peer之间选举出来的，或者组织的主动指定的。Anchor Peer主要作用是用于Peer之间的发现。

“八卦”当然是需要时间的，回顾一下，前面为什么讲：


    为了防止舞弊，甚至于只有从自己的Peer上查询出同样的数据后，才能开始履行现实世界中的职责。


System Chain与Orderer的存在，使“控制信息的传播范围”成为可能。既然Orderer是输出数据的源头，那么就可以通过Orderer控制信息的传播范围了。


Fabric的private confidential transactions，也正是借助这两者实现的。


在Fabric中，参与者可以三五成群，创建属于小团体的私链，也就是Channel。每个Channel的成员名单，记录在system chain中。因此Orderer就可以将数据只分发给对应Channel中的Anchor Peer。（思考：有没有办法截获？）


如果你看过Orderer的data目录，就会发现每个Channel都会有一个独立的链：



而Peer的data目录中，只会有Peer所加入的Channel的链：



需要注意的是Orderer中的链与Peer中的链是不同的。Oderer的链中存放的是Channel的配置，是system chain，Peer的链中存放的是Channel的数据。比对一下它们的内容就可以知道。


Peer与Orderer交织，数据更新请求在Orderer之间来回穿梭，最终被送往了Anchor Peer，大嘴巴的Anchor Peer转身通知了身边的所有Peer。


组成网络的每一个Peer和Orderer，都是得到了批准的、实名的，想要访问这个网络的用户也需要得到批准，并实名签署自己的操作。


这就是Fabric网络。



## 合约



每个参与者都保存了一份正确的数据（通常被称为账本），这就足够了吗？


当然不是。


如果账本可以不经过你的同意就被修改，那么保存再多份，也没有意义。


Orderer们之间形成的共识，是一个技术上的共识，确定的是数据变更的顺序，是由运行中的程序通过固定的流程决定的。


而“数据要被更改成什么、更改的约束是怎样的”，则需要参与者们在现实世界里达成共识。这个共识，更像谈判后签署的合同，在区块链中，被称为合约。


“合约”规定了数据应当被如何修改，修改时需要满足怎样的条件，或者是在什么情况下触发修改。这个话题早在2004年，就有人开始研究了。


落实到Fabric，合约就是分布在每个Peer上的容器。


首先使用Go或者js编写处理逻辑，代码中约定了数据的修改方式。然后这些代码会被打包、签署，并提交到Fabric中，最终成为Peer上的一个Docker容器。


当需要读取或者修改数据的时候，网络外的用户是接触不到账本的。他们只能通过Peer上运行的容器的服务接口，读取或者更改账本上的数据，从而确保一切都在按照参与者们商量好的剧本进行。


为了防止舞弊，这里有很多精心的设计。


譬如，合约是可以升级、改动的，但是谁可以执行升级、改动的操作呢？这里需要有一个约束，只有在当初签署了合约的人员都同意的情况下，才能更改合约。


再有，合约是运行在每个Peer上的，而Peer是掌握在每个参与者自己手里的。服务器在自己手中，可以做的事情就太多了，怎样防止有人篡改了自己管辖的Peer上的合约呢？


这里有一个叫做背书策略的设计，通过背书的策略，可以约定只有当多个Peer上的合约都得出同样的结果时，对合约的调用才能被接受，只对自己的Peer动手脚是不行的。


合约需要在每个Peer上进行安装的，但激活只需要一次。安装合约其实就是将打包的合约上传到了Peer上（当然这中间还有一些其它检查）：





## MSP


MSP绝对是最让人疑惑的地方了。


它是一个包含了根证书、证书（经过CA签署的公钥）和私钥的目录。在组织、组件和用户，三个地方会用到。


组织的MSP目录中，包含的是组织管理员的证书、用来验证用户证书有效性的根证书、和验证TLS通信使用的证书的根证书。


下图中，就是组织org1.example.com的msp目录，里面只有三个证书：



注意，组织的msp目录中包含的全部是可以公开的证书，没有私钥。


因为组织的msp目录，是要被写入到system chain中的。



被包含在组织msp目录中的证书，主要被用来验证用户证书的有效性。


用户的证书怎样才能认定为有效呢？必须是用根证书对应的私钥签署的，否则就会被认定为无效，并拒绝服务。


Fabric就是通过这种方式，实现了网络的准入：


    permissioned networks


要想接入到Fabric网络中，必须向拥有根证书私钥的机构，申请一个证书。通过这个限制，保证Fabric网络中的参与者的身份都是真实的（参与者的证书被盗用除外）。


除了组织的msp目录之外，还有组件的msp目录和用户的msp目录。


组件的msp目录和用户的msp目录其实是一回事，只不过组件msp的使用者是Fabric网络中的peer和orderer程序，而用户msp目录的使用者是Fabric网络之外的个人或者客户端。


换言之，访问Fabric网络的个人或者客户端，要有一个账号；组成Fabric的网络的每个Peer和Orderer也要有一个账号。MSP中存放的就是每个账号的私钥和证书。


组件的msp和用户的msp中的内容是这样的，可以看到，相比组织的msp多出了账号私钥和账号证书：



Msp目录中需要特别注意的是admincerts目录，这个目录里存放的是某个账号的证书。


在Fabric中有一些操作是可以设置为只有管理员才能执行的，譬如部署合约。


那么怎样判断当前发起操作的是不是管理员呢？


答案就是，检查当前用户的证书与admincerts中的证书是否一致。注意，组织msp中的admincerts是被写入到system chain中的。


除了账号的私钥和证书，Fabric中还存在一套TLS证书，这套证书就很好理解了，它们是用来对grpc通信过程加密的。Fabric的Peer、Orderer之间使用grpc通信。


Msp目录可以用Fabric提供的cryptogen命令生成，但是用cryptogen命令生成是非常不灵活的，生产环境中，应当使用Fabric提供的另一个组件FabricCA。


注意FabricCA不属于Fabric网络，它是网络之外的一个用来签署证书的服务。借助FabricCA，还可以实现账号的分级，简单说就是一个组织的管理员，可以自由地创建属于该组织的子账号。（这是刚需）




## 配置


配置分两种。


一种是组件的配置文件，也就是orderer的配置文件orderer.yaml以及peer的配置文件core.yaml。一种是system chain中的配置区块。


一个系统无论多庞大、多么复杂，扒到底，永远都是“命令+配置”。peer的配置文件是core.yaml，orderer的配置文件是orderer.yaml。


很多事情不清楚？那就把它们的配置文件扒一遍。


操作system chain中的配置区块，是有一点障碍的，因为它们被存放在Fabric网络中，读取、更新，都比较繁琐。


前面提到过，部署Fabric时使用的创世块（在orderer.yaml中指定的文件），是system chain的第一个区块。这个区块通常是用configtxgen命令生成的。


configtxgen除了可以生成创世块，还能将二进制的创世块转换成json格式。可以用下面的命令查看创世块的内容：


    configtxgen -inspectBlock ./genesisblock


从Fabric的网络中也可以读取到指定channel的当前配置：


    ./peer.sh channel fetch config config_block.pb -c mychannel -o orderer.example.com:7050


只不过读出来的文件都是protobuf格式的，需要在另一个工具configtxlator的帮助下，将其转换为json格式：


    configtxlator proto_decode --input config_block.pb --type common.Block


更新system chain的过程更繁琐，以在Channel中添加一个新的成员为例。


在Channel中添加一个新的成员，实质就是修改Fabric网络中记录的Channel配置。这个过程需要好几步：


    生成新成员的json格式的配置文件

    从Fabric中读取Channel最新的配置

    将读取的Channel配置转成json格式后，将新成员的json配置加入其中

    将修改后的Channel配置和修改前的Channel配置都转成protobuf格式，然后用configtxlator生成更新文件

    将更新文件由protobuf格式转换成json格式，加上包含channel信息的信封后，再转换成protobuf格式

    将加信封的protobuf格式的更新文件发送给Channel中其它组织的管理员，让他们用自己的私钥进行签署

    最后由其中一个管理员将得到足够签署的更新文件提交到Fabric网络


这个复杂的过程，可以到http://www.lijiaocn.com中查看。




## 其它



HyperLedger Fabric其实还是比较复杂的。


最直接的证据就是，不少人通过Fabric提供的docker-compose编排文件，迅速在本地启动了一个Fabric网络，并体验了一下合约。但依旧对Fabric不理解，把握不住、无法掌控，遇到了问题不知道如何解决。


这要归罪于docker-compse等编排技术，在带来便利的同时，隐藏了太多内容（Docker带来的不便利），并且导致项目文档也不被好好写了，直接抛出“./start.sh”，就万事大吉。


真得要一文解除所有疑惑，还是比较困难的，这里也只是尽可能对我认为容易让人疑惑的地方做了说明。


折腾本身比较磨人，将得到的认识梳理成文，同样磨人。譬如此文，从上午10点开始，到下午6点才完成，又润色校对到半夜，欢迎转发....


如果你还有更多疑惑，不妨多多折腾几次，也可以关注、留言、加微信（关注后可以得到微信号），一起探讨。




## 最后



以上是折腾Fabric的过程中，形成的一些认识，希望对你有所帮助。我对它的了解其实很浅，还未能深入到实现细节中。但大的方向，应当是对的，一个新事物要想摆脱“常识”的约束，千难万难。


如果有错误、不恰当的地方，恳请指摘。


最后，做个小广告吧。用了几个周末的时间，把Fabric的折腾过程录制成了视频，发布到了网易云课堂。这几个视频的定位是“帮助入门”，折腾过程全都记录在www.lijiaocn.com中了，因此视频并不是必须的，它只是用操作演示外加语音讲解的方式，更好地帮助入门。


这是第一次试水视频教程，投入产出比会是怎样的呢？我也非常好奇。


有需要朋友，点击阅读原文领取。不需要的朋友，欢迎转发喽～

## 接下来...

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

## 参考

1. [超级账本HyperLedger Fabric，掰开揉碎，一文解惑][1]
2. [超级账本HyperLedger旗下项目介绍][2]
3. [超级账本&区块链][3]

[1]: https://mp.weixin.qq.com/s/dcTCI7k_tyAqGKbLmzYR_A  "超级账本HyperLedger Fabric，掰开揉碎，一文解惑" 
[2]: https://mp.weixin.qq.com/s/hiGBf5TBWhqt63IBiNrgSA  "超级账本HyperLedger旗下项目介绍" 
[3]: http://www.lijiaocn.com/tags/blockchain.html "超级账本&区块链"
