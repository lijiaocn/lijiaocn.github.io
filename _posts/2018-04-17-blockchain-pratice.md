---
layout: default
title:  区块链技术实践过程中的一些思考
author: 李佶澳
createdate: 2018/04/17 12:43:00
last_modified_at: 2018/05/14 12:25:15
categories: 项目
tags:  blockchain
keywords: 区块链,hyperledger,fabric
description: 最近承接了集团供应链项目的技术开发工作，要将区块链技术引入到项目中

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

首发于微信公众号“我的网课”，[区块链技术实践过程的一些思考][1]。

最近承接了集团供应链项目的技术开发工作，要将区块链技术引入到项目中。从承接到现在大概有三周的时间了，耗费了不少的脑细胞。


在这里把一些思考的过程和结果记录下来，一是防止遗忘，二是重新梳理思路，三是希望认识上的偏差能够得到更多有识之士的纠正。



## 为什么要引入区块链？



在三周前，对区块链的了解大概仅限于知道比特币这个名词。尝试使用区块链，其实是“知道锤子，找钉子”过程，区块链这把锤子都还没有被握在手中。


但我们还是倾向于尝试一番的，因为现在的社会是鼓励冒险的。如果能够为一个出镜率相当高的技术找到非常恰当的应用场景，并完成了实现，一个正常的社会会给予足够的回报。


耗费时间去探索潜在的可能性，我认为是值得的。



## 能用来做什么？



陆陆续续地看了不少关于区块链的资料，有的说可以用它来做商品溯源、做公证、做公益、做保险理赔等等，还有某某银行应用了区块链，某某大集团开始应用区块链。


这些文章几乎没有一篇能够给出一个清晰的思路，它们很多都遵循着一个模式：


    首先讲一大通，在XXX行业，在XXX场景，存在这样、那样的不足，这样那样的问题。读者和观众们频频点头，确实如此。


    然后就是，“我们可以在这些场景中应用区块链”。胃口被吊的足足的读者和观众们，翘首以盼接下来的一二三条，分别是如何如何解决问题的。却突然没了。


    然后开始举下一个场景。如果有较真的观众追问为什么，就意味深长地回答一句，因为区块链不可篡改。


意味深长的回答，都不是好东西。不能讲清楚细节的经验，都是唬人的。


我们不愿做唬人的事情，费劲心力想到了区块链的一些可取之处，以及它在一些场景中的用途。但是目前还没有足够地信心说，区块链解决了很大的痛点，因为这需要得到使用者的认可。



## 先说本质



在过去三周的极度困惑之中，我们发现，搞清楚的事物的本质是非常有帮助的。我们尝试使用HyperLedger Fabric，在粗略地搞懂它的组成，弄清楚了它的用法之后，陷入了长时间的混乱：


    应当怎样将它融入到项目中，设计的时候需要遵循怎样的原则？


导致思路混乱的根本原因是，没有想清楚要解决的问题是什么。


这个混沌状态是不可避免的，特别是在尝试应用新技术的时候。这时候从两个方向努力，一是与用户沟通，搞清楚用户目前的状态，发现其中的痛点，而是研究技术细节，搞清楚新技术到底能用来做什么。


我是从技术的角度思考的。关于区块链应用的文章很多，如同春日漫天飞舞的柳絮般迷眼。最终还是从第一手的资料——中本聪的论文中，找到了思路。（见《为区块链呐喊几声》）


区块链是数据前后关联的链状结构，修改了某一处的数据后，后续的数据都要一同更改，增加了修改的难度。从这个特点出发可以衍生出一些产品，但是场景可能有限。这是第一个思考点。


比特币带来的启发更发散。比特币解决了网络空间中，两个个体在没有第三方介入的情况，完成支付的问题。那么还有哪些场景中，需要在没有第三方介入的情况下完成呢？为什么要去掉第三方？怎样才能避免出现各执一词无法辨别的情况？这是第二个思考点。


第三个思考点来自一个名字。


在思索如何将区块链应用于供应链时，翻阅了几个主要互联网公司的白皮书。其中京东发布的白皮书提到，在SOA的方式中，数据仍然分散在各个参与方的。


毫无头绪的我们抓住了这根救命稻草，就按照SOA的思路去设计了，将数据统一存放在区块链中。设计的系统中有六个角色，在进行数据的安置时遇到了问题：


    六个角色各自的数据是分开，还是融合在一起？要不要设计以及设计怎样的存取方式？合约应当一个，还是六个，或者每个用户一个？合约的目的是什么？


将数据写入区块链很简单，写合约也不难，但这是远远不够的！


    一个好的系统应当有清晰明确的设计原则，在几个大原则的约束下，各个组件各归各位，每条数据各得其所，开发人员按规则行事，不仅职责明确、工作简单、效率高，而且不易出错。在遇到新情况、新需求的时候，也能够有章可循、有法可依。


最终是从“HyperLedger”这个名字中得到了启发。Ledger是账本的意思，Hyper是超级。这个账本超级的地方在哪呢？答案是：


    先卖个关子:-)




## 开始找钉子



在我想清楚问题的本质之前，已经按照SOA的思路完成了初步设计，并分配了开发demo的任务。但我内心非常不安，除了因为舍车保帅暂时忽视了很多非主干的细节外，我更担心走错了路，没有发挥出区块链应有的价值，做了一些可有可无的事情。


因此我没有停止思索，而是继续思考本质，寻找更多钉子验证想法、佐证我们的设计。搜索了很多资料，仔细分辨，去粗取精后，找到了三个钉子。



### 钉子1：电子合同



如果我没有记错的话，数字签名的技术，早在我高中的计算机课本上就出现了。它要解决的问题是：不见面的双方，怎样通过网络签署合同。


答案是：


    用自己的私钥加密文件或文件的hash，然后连同公钥一起发送给对方。


    对方用你的公钥验证这份文件，以此作为你认同合同的证据。因为只有你有私钥，被加密后的文件，只有你能生成。


    对方的意见用同样的方式确认。


这门很老的技术后来是如何发展的，应用情况如何，我就不知道了，反正我在使用各种互联网服务，勾选同意时，没有用到私钥。


区块链可以用于电子合同的签署。


在Fabric中，调用合约接口写入数据时，是需要调用者提供私钥和证书的，因此可以确保数据确实是调用方写入的，除非他自己把密钥泄露了。谁写的就是谁写的，谁追加的同意就是谁追加的，写入的数据就是一份明明白白地电子合同。


用区块链的好处是什么？


好处是，签署过程既不全是在甲方的IT系统完成，也不全是在乙方的IT系统完成，也不在第三方的系统里完成。当双方发生纠纷的时候，法庭只需要取出数据一看便知双方是否曾经达成意向（这套系统需要得到法庭的认可）。


为什么要撇开第三方呢？ 因为不会把两个人的事情，暴露给第三方，从而也就没有人可以从中作梗。这个理由，我认为是充分的。




### 钉子2：交易过程




想一下你在淘宝上买东西的过程。你把钱打给了淘宝，然后买家发货，等你收到货后，你才会让淘宝把钱交给卖家。如果你和卖家有冲突了，淘宝进行裁决。钱在淘宝那里，淘宝的裁决是有分量的。


整个交易过程中的信任基础，是淘宝这个第三方提供的。


如果卖家自己做了个卖货的系统，你下单支付后，卖家拿到钱，然后删除了你的订单记录，你是不是就有口难辩了？虽然你可以截图，但对方完全可以说你的截图是假的。你申请法院调查对方的服务器，对不起，日志已经删除的干干净净。如果订单还在，你说你没收到货，对方说货已经发了，又是各种扯不清。


在淘宝的整个交易过程中，作为第三方的淘宝必须是可以信赖的，如果淘宝作假，那事情就没法处理。前不久作家六六公开投诉某自营电商，该电商说自己绝对不会删除用户与客服的沟通记录，那么是它有能力为之而不为的声明更可信，还是其不具备删除的能力更让人信服？


通过区块链可以撇开第三方，直接在两个人之间建立信任。


    买家A把下单的事实记录到区块中


    卖家B把确认订单的事实也记录到区块中


    物流C把从B取货的事实，当着B的面，记录到区块中，然后才能拿走货


    买家A当着C的面，将收货的事实记录到区块中，否则C拒绝给货


    B以区块中的记录为依据，要求A付款，如果A拒绝，立即走法律途径


    A付款后，要求B将收款事实记录到区块中，如果B拒绝，立即走法律途径


整个过程没有第三方背书，但是区块链网络必须不受任意一方的控制，A、B、C可以各出一台服务器作组成一个区块链网络。


要求个人搭建节点是困难的，不如让可靠的第三方背书，因为对个人而言，相比存在的风险，方便更为重要。但是对于大型企业而言，降低风险可能更重要。




### 钉子3：融资与清算




一直让我对区块链心存挂念的是：


    各国央行与大型银行对区块链很重视。


人民银行很早就成立数字货币研究所，这件事在币圈的传播之下，已是人尽皆知。国外的银行采用区块链技术的资讯也经常传播到国内。


如果要将体制内的部门，按照聪明程度排序，掌管货币政策、紧盯世界各国经济形势的央行，绝对位居前列。能得到央行关注的技术，必然有独特之处，他们关注的到底是什么？


这个疑问在我心头盘绕了很久，承接了集团供应链系统的技术开发工作后，更是有意识的往金融方向思考。


一个大型集团，特别是传统行业的大型集团，是相当复杂的。在它从弱到强逐渐壮大的过程中，它会不停地向整个产业链的上游和下游延伸，往往是每开拓一个业务，就成立一个新的公司。子公司壮大后，又会引入多方投资，以及设立孙公司等。


集团内大量的子公司互为供应关系，账目繁杂。同时，大型集团往往在产业中具有举足轻重的地位，依附于它生存的供应商的数量也相当可观。它对大量资金的强烈需求，也与银行的放贷需求不谋而合，合作的银行，合作的形式都很多样。


我们接触金融和供应链的时间较短，无法一口吃下这个庞大组织内部外部的各种交互关系。于是从中抽取出了最简单的一种关系，经过思考，认为可以从区块链上得到一些益处。这个关系就是：融资。


大型集团内部的资金流动复杂，通常都会成立一个专门的财务公司，集中处理资金，子公司的融资需求均由财务公司满足。


    要怎样才能确定融给子公司的钱，没有被挪作它用呢？


    当集团下有几十乃至上百家子公司的时候，要怎样能够追踪到每一笔资金的流向？


答案是将所有的行为数字化，让每一笔生意的往来都原原本本的暴露在集团面前。什么时候订购的货物，多少钱，由哪个子公司配送的，配送的情况是怎样的，这些信息全部数字化。


数字化是不是就要用到区块链？ 不是。可以设计一个很复杂的系统，容纳所有信息，强制每个子公司都使用这套系统，所有的申请、审批都线上化，并且每次融资都关联到每个具体的交易，交易的信息也在该系统中存储。


这样的系统，我相信应该早就有了。谈起IT的时候，人们更多想起的是BAT等互联网公司，但真正愿意花钱买服务的是传统企业，这是一个相当大市场。


虽然对过去几十年企业市场上的风云变幻并不了解，但我有一种直觉，区块链可以用来重塑这套系统。社会的发展的过程是分工越来越细，专业人员产出越来越高。IT系统演化的过程是，最困难的地方逐渐由一个底层系统或一个平台解决，上层系统的构建变得更加简单自由。区块链有成为底层系统的潜质。


刚开始，我们想就先把区块链当成数据库，把数据写上去再说。真正到动手时候，才发现没有章法可依，遇到文章开始处所说的问题（“先说本质”）。


这个梗在心里堵了很久很久，最终恍然大悟，超级账本，它到底哪里超级呢？ 答案是：


    共享


这个答案可以为迷惑的同学至少节省两周的时间，也可以作为需要向老板做报告却始终无法打动老板的同学的最强大的武器。在我看到各种资料中，只有一份资料触及到问题的本质，其它的几乎都是人云亦云、模模糊糊。


    请仔细想一想，这个特点是不是很厉害？


集团内部有无数的子公司，这些子公司会有各种各样的IT系统，虽然可以强制它们接入到集团花费了大价钱定制的相当难用的系统中。但是集团外部还有更多的公司，它们会与这些子公司发生进行更多的交易。


    每个公司一笔账，查起来费劲不费劲？追踪资金难不难？


如果它们使用同一个账本，是不是就容易多了？不只是我们有这样的想法，多家金融机构组成的联盟R3也是这么想的。在阅读R3的白皮书的时候，我欣喜地发现，这个让人内心忐忑不安的想法，一步步地得到了印证。”央行和大型商业银行为什么研究区块链“，这个问题也豁然开朗。

## 更多交流

我们当前还是使用fabric进行poc，以后有时间会深度研究一下R3，发布一下我对R3白皮书的解读，我的微信号是lijiaocn，欢迎加我好友。不过我是一个思虑过多、同时精力不足的人，工作上的事情已经让我焦头烂额，然后还爱想些乱七八糟的......有疑问或想要分享的，可以到下面这个圈子里交流。这是知识星球里最便宜的圈子，设置门槛纯粹是为了保证交流质量 

![区块链实践知识星球]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [区块链技术实践过程的一些思考][1]

[1]: https://mp.weixin.qq.com/s/C79vLF_-Lm6cMYecr2mjSg  "区块链技术实践过程的一些思考" 
