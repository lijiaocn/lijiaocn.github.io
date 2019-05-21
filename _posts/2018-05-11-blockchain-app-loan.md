---
layout: default
title:  区块链在互联网借贷领域的应用探索
author: 付银海、徐秋园
createdate: 2018/05/11 16:49:00
changedate: 2018/05/11 18:54:13
categories: 方法
tags: blockchain
keywords: 区块链,互联网借贷,互联网金融,联合放贷,资产共享
description: 当信贷机构获得大额借贷客户时，可以通过区块链进行资产共享，从而联合其他信贷机构共同放贷

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这篇文章转载在[《区块链在互联网借贷领域的应用探索》][1]，是一篇难得的将应用场景和实现方法讲明白的文章。

## 业务背景

在金融借贷领域，获客、资金和数据安全是核心痛点。随着互联网人口红利的消失，获客成本日益高企，提高客户转化率成为金融借贷机构解决痛点的有效措施。当借贷机构通过各种营销手段获得优质客户，但资金不足的情况下，如何在不流失客户的同时满足客户需求? 借款金额上限的规定，网贷平台如何留住这些大额借款客户?

当借贷机构通过各种营销手段获得客户，但因自身信贷产品无法满足客户需求时，信贷机构可以将资产通过区块链进行共享，将资产拍卖给其他机构而获益； **当信贷机构获得大额借贷客户时，可以通过区块链进行资产共享，从而联合其他信贷机构共同放贷**。

基于区块链技术建立可信的信贷联盟，在保护客户信息不被泄露的情况下完成资产共享将解决以上问题。以提升资产价值为愿景，利用区块链去中间人、公开透明和保护隐私的特点来解决价值传输的问题，实现信贷机构间的资产共享。本文提供了一个基于超级账本的借贷资产共享解决方案。

## 用例定义

本用例提供了资产共享的一个简单路径和实践，共有两个信贷机构，一个信贷机构作为借贷资产标的共享的发起方（贡献机构），有资产共享的需求，另一个信贷机构为参与借贷资产共享的响应方（参与机构）。本用例只为信贷机构提供借贷资产信息的信任传输，其后的放贷流程不在本用例范围内。

为了完成资产在信贷机构间的可信任传输，需要解决以下几个问题：

	A、如何在借贷资产共享前后明确所共享借贷资产的所有权？
	B、如何保证贡献机构的借贷资产信息在没有获益前不泄漏？
	C、贡献机构如何将已有风控数据分享给参与机构？
	D、当参与机构需要更多借款人的风控数据时如何经由贡献机构联系到借款人？
	E、如何让贡献机构高效将借贷资产上链？
	F、如何确保借贷资产共享多方间的借贷资产交易符合金融监管？

关于资产确权，传统互联网解决了信息传输速度更快、传递成本趋零的诉求，但是没有解决价值的转移和信用转移的问题。为了保护资产所有权，必须使用更高级别的信息安全保障。只有经过所有权人授权后才能对资产数据进行风控评估、大数据分析等操作，但又无法接触到资产的原始数据，更不能对数据进行复制和篡改。

另外，资产共享记录不可篡改或虚构，任何数据都应该可以追本溯源，从而保证共享机构之间的价值交换数据可以随时被追踪和验证，保证信息的真实。

为了在达成资产共享意见一致之前保护客户数据不被泄露，在资产共享之前需要对客户敏感数据进行脱敏处理。如在机构发起资产共享时，需要将客户的三要素进行加密处理，在机构间达成资产共享共识之后才能将三要素解密。

资产合规交易除了最大化地保护数据不被泄露外，`不能由中介机构沉淀数据`，否则中介机构一旦被黑将会导致客户数据泄露。同时由于金融监管的原因，传统银行、小贷公司、保险公司、P2P网贷、消费金融公司以及网络借贷信息中介机构等机构间的资产共享受到限制，如何将这些机构间的不同类型的资产顺利完成共享需要一种支持不同类型业务数据处理逻辑的技术来完成。

完成资产在信贷机构间共享本质是`解决机构间的信任问题`，让资产在机构间能够自由传输共享。需要记录信贷机构参与资产共享的完整过程并且不能篡改、可追踪。

**当前方案**：当前借贷资产在信贷机构间共享大多采用中介机构集中管理的模式，信贷机构将共享的资产上传到中介机构，然后设置共享形式如抢单、拍卖或是联合放贷，最后信贷机构在中介机构制定的规则下达成交易。达成交易的信贷机构除了产生资产交易的费用之外还需给中介机构佣金。通过中介机构完成资产共享的模式最终会使中介机构拥有大量的借贷者信息，在获客成本不断提高的背景下，中介机构价值不断提升，若中介机构受到黑客攻击将导致借贷者信息的泄露，从而影响信贷机构利益。

**资产价值**：在资产共享的各种场景里，如多家信贷机构联合授信放贷，有效解决大额贷款客户流失的问题；由于获客成本和数据成本多家信贷机构共担，从而降低机构显性成本；若资产出现坏账，多家信贷机构共同承担，降低坏账损失。

## 方案选型

区块链分为公有链、联盟链和私有链，本文解决的问题适合联盟链的解决方案， 当下可选平台不多，我们考察了腾讯的trustSQL（将在2018年第二季度推出公测）、云象区块链等平台，其当前实现落地应用及开放程度有限；Corda分布式平台，由于没有统一总账，每个“节点”必须自行存储自己的交易数据，对接入平台要求较高。

最后我们选用了出块时间快、支持多通道、安全性高的超级账本。超级账本提供相互隔离的多通道解决方案，支持不同类型的业务数据的处理逻辑，天然地符合金融信贷场景。

例如，将参与资产拍卖的信贷机构组成一个联盟，此联盟中的机构对于资产拍卖拥有一致共识。使用基于联盟的模型，同一联盟中的机构可以相互信任将彼此的资产在联盟中自由共享而不用担心客户信息的泄露。

![hyperledger fabric特点]({{ site.imglocal }}/loan/1.png )

实际开发过中，结合团队的技能特点，最终我们选择了构建于Hyperledger Fabric之上的Hyperledger Composer方案。

## 架构设计

### Hyperledger Fabric简述

在最新的版本中Fabric架构实现了以下特性：

    解耦了原子排序环节与其他复杂处理环节，提高可扩展性；
    解耦交易处理节点的逻辑角色为背书节点（Endorser）、确认节点（Committer），可以根据需求和负载进行灵活部署；
    加强了身份证书管理服务，作为单独的Fabric CA项目，提供更多功能；
    支持多通道特性，不同通道之间的数据彼此隔离，提高隔离安全性；
    支持可拔插的架构，包括共识、权限管理、加解密、账本机制模块，支持多种类型；
    引入系统链码来实现区块链系统的处理，支持可编程和第三方实现。

Fabric的整体架构图如下：

![hyperledger fabric整体架构图]({{ site.imglocal }}/loan/2.png )

Fabric为应用提供了gRPC API，以及封装API的SDK供应用调用。应用可以通过SDK访问Fabric网络中的多种资源，包括账本、交易、链码、事件、权限管理等。

其中，账本是最核心的结构，记录应用信息，应用则通过发起交易来向账本中记录数据。

交易执行的逻辑通过链码来承载。整个网络运行中发生的事件可以被应用访问，以触发外部流程甚至其他系统。权限管理则负责整个过程中的访问控制。

账本和交易进一步地依赖核心的区块链结构、数据库、共识机制等技术；链码则依赖容器、状态机等技术；权限管理利用了已有的PKI体系、数字证书、加解密算法等诸多安全技术。底层由多个节点组成P2P网络，通过gRPC通道进行交互，利用Gossip协议进行同步。

### Hyperledger Composer简述

Hyperledger Composer是一个全面的、开源的开发工具集和框架，使开发区块链应用程序更容易。主要目标是为加快应用开发的时间，并使区块链应用程序与现有业务系统的集成变得更加容易。

Hyperledger Composer支持现有的Hyperledger Fabric区块链基础架构和runtime，支持可插拔的区块链共识协议，以确保交易根据指定业务网络参与者的策略进行验证。

日常应用程序可以使用来自业务网络的数据，为最终用户提供简单和受控的接入点。

使用Hyperledger Composer可以快速建立当前的业务网络模型，包含现有的资产和与之相关的交易; 资产是有形的或无形的商品、服务或财产。作为业务网络模型的一部分，可以定义与资产交互的交易。业务网络还包括与他们交互的参与者，每个参与者可以与多个业务网络中的唯一身份相关联。

![hyperledger composer结构图]({{ site.imglocal }}/loan/3.png )

### 领域模型

![hyperledger fabric特点]({{ site.imglocal }}/loan/4.png )

**Borrower Person**：借款人

**Loan Application**：贷款申请

**Creditor Org**：出借机构

**Token Issuer**：TOKEN分发／承兑机构，在TOKEN章节详细表述

**Creditor Contributor Org**：借贷资产贡献机构，是出借机构的子概念

**Creditor Participator Org**：借贷资产参与机构，是出借机构的子概念

**Loan Share Plan**：借贷资产分享计划，由"借贷资产贡献机构"通过区块链客户端贡献并记录到区块链分布式账本

**Loan Share Confirm**：借贷资产分享确认，由"借贷资产参与机构"通过区块链客户端接收到《借贷资产分享计划》后确认产生，并记录确认额度和确认利率，智能合约根据分享计划里的代币费率和确认额度计算出代币费用，并从参与机构账户中扣除

**Data Service Provider**：数据服务商，为借贷资产共享各方提供补充数据服务，将在另文《数据合规利用》中详细表述

### Token

本用例对TOKEN（代币）不做过度设计，也不考虑赋予代币在联盟外部流通的能力，更不考虑通过ICO募资，原因如下：

	A、为了简化设计；
	B、借贷资产共享业务本身期望其内部流通的TOKEN（代币）相对恒定，否则难以使得业务运转起来；
	C、我们团队对区块链的理念《踏实将区块链技术落地到具体产业，解决具体问题》

A、TOKEN分发机构由借贷资产联盟发起方担任。

B、出借机构通过线下付款方式向TOKEN分发机构以1RMB／1TOKEN的恒定价格购买。

C、出借机构可以要求TOKEN分发机构以1RMB／1TOKEN的价格承兑为RMB。

D、贡献机构在贡献具体借贷资产时有权标明借贷资产的TOKEN价格，例如：1TOKEN／1万RMB借贷额度；参与机构参与资产共享活动并确认后需要向共享机构支付相应的TOKEN；贡献机构通过TOKEN发行机构将所赚取的TOKEN兑换为法币RMB。

E、出借机构在具体贷款审核需要向数据服务商购买数据服务时，也需要支付相应的TOKEN，数据服务商可以通过TOKEN发行机构将所赚取的TOKEN兑换为法币RMB（具体数据服务商如何参与将另文《数据合规利用》表述，敬请期待）

![业务流程、token流转]({{ site.imglocal }}/loan/5.png )

### 整体架构

![整体架构图]({{ site.imglocal }}/loan/6.png )

贡献机构借贷审核人员可以：

	通过所在机构自有的网贷管理后台经预先植入的资产上链JS－SDK选择可以分享的借贷资产，
	并设定分享条件（分享额度10万RMB，分享利率18～20%年化，代币费率1万借贷额度RMB／1TOKEN）
	
	通过链上资产－客户端－WEB上传预先导出好的贷款申请EXCEL文件，并设定分享条件
	（分享额度10万RMB，分享利率18～20%年化，代币费率1万借贷额度RMB／1TOKEN）
	
	通过链上资产－自主开发－客户端创建借贷资产分享计划，并设定分享条件
	（分享额度10万RMB，分享利率18～20%年化，代币费率1万借贷额度RMB／1TOKEN）后，通过链上资产－客户端－API做后续处理

**链上资产－客户端－API**对上传上来的《借贷资产分享计划》敏感字段：借款人、身份证、手机号、车牌号、发动机经过同态加密做脱敏处理（防止贡献机构在取得参与机构代币前关键借贷信息泄漏），而对于非敏感字段（借款额、风控结果、参与条件……）直接明文链上传输。

通过调用借贷资产智能合约的 **资产上链API**，将借贷资产分享计划记录到联盟参与机构各自Peer节点的CouchDB数据库中。

参与机构审核人员，通过本机构区块链节点收到借贷资产上链的事件通知。

参与机构审核人员通过 **链上资产－客户端－WEB**确认要参与借贷资产分享计划，并确认参与条件（参与额度8万RMB，参与利率18%年化，代币费用由合约自动计算为8TOKEN）

经由 **链上资产－服务端**调用 **链上资产－API**生成《借贷资产分享确认》；同时合约会对参与方的代币账户做扣减操作；

通过智能合约的事件机制将分享确认信息传递给贡献机构的区块链节点，并由节点上的智能合约对步骤2中加密过的字段解密后再用参与机构的公钥做加密处理后反馈回区块链网络；

参与机构再次通过事件机制，收到经由参与机构公钥加密过的敏感信息，通过参与机构持有的私钥解密敏感信息，完成借贷资产分享活动

链上资产－服务端可以选择性地将过往收到的共享计划／共享确认转存到本地RDBMS数据库，方便本地化操作

### 链上架构

每个参与资产共享业务的机构（贡献方、参与方），都需要有自己的区块链节点（可以在云上也可以在自有机房）；并且至少需要有自己的区块链运维工程师，负责区块链相关代码管理，节点维护等工作；而智能合约用到的源代码在参与共享的机构间需要公开。

![联盟成员的链上架构]({{ site.imglocal }}/loan/6.png )

开发工程师可以基于Hyperledger Composer开发商业网络。每一个商业网络由智能合约逻辑JavaScript脚本（ES5）、权限控制（ACL）、查询（Queries）和模型文件（包含Participant、Asset、Event、Transaction）构成。

经过Composer开发工具打包后形成商业网络包（Business Network Archive）在授权文件 **Business Network Card**的协同下通过Composer部署工具部署到给定 **资产共享Channel** 涵盖的Peer节点上（这些Peer节点是跨机构通过Internet连通）。

每个Peer节点，按职能可以分为：Endorser／Committer。

同一个Peer节点可以充当任意职能或两者；每个Peer节点可以连接到指定的CouchDB，并用所连接的CouchDB作为本地账本的存储；Composer Runtime作为由Go语言开发的合约会在初始化阶段部署到参与业务的所有Peer节点上。

分属不同机构的Peer节点通过Anchor节点构成一个Channel，同一个Peer节点也可以加入多个Channel，但合约的执行与消息分发是以Channel为边界的，同一个Channel可以跨多个参与机构，网络层面通过Anchor节点连接；Anchor节点存在与每个机构内部，起到代理机构内其它无法连接Internet Peer节点消息对外沟通的作用。

Hyperledger Fabric 提供了基于Node.js的客户端API可以供Composer Client SDK（Node.js）使用。

Composer Rest Server经由Hyperledger Composer Loopback Connector调用Composer Client SDK达成对CTO所定义模型REST化服务露出，这些服务包括：

	资产上链（贡献机构使用）
	分享确认（参与机构使用）
	分享监听（贡献机构、参与机构在链上资产分享发生变化时使用）
	代币充值（TOKEN发行方用于给出借机构账户充值代币）
	数据解密（当参与机构确认参与分享后会向参与各方释放对应的事件，贡献机构收到事
	          件后对之前分享的资产中的敏感字段做解密处理然后再用参与方的公钥做加
	          密处理并再次释放事件，参与方收到贡献方再次释放的事件后用自己的私钥
	          对敏感信息做解密处理）

## CTO模型

命名空间定义：

	namespace org.tl.biznet

枚举类型定义：

	// 借贷类型
	enum LoanType {
	  o CASH // 信用贷
	  o CONSUMPTION // 消费贷
	  o PROVIDENT_FUND // 公积金贷
	  o ENTERPRISE // 企业贷
	  o CAR_MORTGAGE // 车辆抵押贷款
	  o POLICY // 保单贷
	  o CAR_PLEDGE // 车辆质押借款
	}
	
	//参与机构类型
	enum PartyOrgType {
	  o CreditorOrg // 出借机构
	  o TokenIssuer // TOKEN分发／承兑机构
	  o DataServicePovider // 数据服务商
	}
	
	//出借机构类型
	enum CreditorOrgType {
	  o CreditorContributor // 借贷资产贡献机构
	  o CreditorParticipator // 借贷资产参与机构
	}

以车抵贷为例的资产数据定义：

	//借贷当事人信息
	abstract concept PartyPerson {
	    o String partyName // 借款当事人(同态加密)
	    o String loanIdent // 证件信息（身份证、统一信用码等(同态加密)
	    o String loanMobile  // 银行预留手机号(同态加密)
	}
	
	//借款人贷款申请
	concept BorrowerPerson extends PartyPerson {
	    o Integer borrower  // 借款额 
	    o LoanType loanKind //产品类型，例：车抵贷
	}
	
	//车抵贷抵押资产信息
	concept CarMortgageInfo {
	 o String licensePlateNumber // 车牌号（同态加密）
	  o String engineNumber // 发动机号（同态加密）
	  o Integer mileage // 里程数
	  o DateTime timeToBuy // 购入时间
	}
	
	//资产数据
	concept AssetData{
	  o String violationFineDataUrl optional // 违章罚款地址
	  o String phoneRecordDataUrl optional // 电话记录地址
	  o String medicalRecordDataUrl optional // 医疗记录地址
	}
	
	//风控结果
	concept RiskControlResult {
	  o String score // 风控得分
	  o Integer loanLimit // 贷款额度
	  o Integer shareLimit // 风控参考分享额度 
	}
	
	//参与条件
	concept JoinLimit{
	  o Integer sharedLimit // 分享额度
	  o Integer sharedRate // 分享利率 （单位：%）
	  o Integer tokenRate // Token费率（单位：1 token/万元）
	  o Integer paticipantCount // 允许参与机构数量
	  o DateTime startTime // 共享资产上链时间
	  o DateTime endTime // 共享资产结束时间
	}

机构数据定义：

	//机构基本信息
	abstract participant PartyOrg identified by partyID{
	    o String partyID //机构ID
	    o String partyName optional //机构名称
	    o PartyOrgType partyOrgType //机构类型（借贷、Token分发、数据服务）
	    o String publicKey optional //机构公钥
	}
	
	abstract participant CreditorOrg extends PartyOrg {
	    o CreditorOrgType creditorOrgType //出借机构类型（借贷参与机构、借贷贡献机构）
	    o Integer balance //Token余额
	}

关键类型participant（参与者）定义：

	//借贷资产贡献机构
	participant CreditorContributorOrg extends CreditorOrg{
	  --> LoanSharedPlan[] sharedAssets //机构已分享资产
	}
	//借贷资产参与机构
	participant CreditorParticipatorOrg extends CreditorOrg{
	  --> LoanSharedPlan[] takeInAssets //机构已确认资产
	}

资产确认回复信息定义：

	//资产参与机构的确认信息
	concept LoanShareConfirm {
	  o String partyID //共享资产参与机构ID
	  o Integer confirmTakeInLimit //确认参与额度
	  o Integer confirmTakeInRatw //确认参与利率 （单位：%）
	  o Integer token optional //Token费用（单位：1 token）
	  o DateTime confirmTime //确认参与的时间
	}

关键类型asset（资产）定义：

	//链上资产模型
	asset LoanSharedPlan identified by assetID {
	  o String assetID //共享资产ID
	  o BorrowerPerson borrowerPerson //借款基本信息
	  o CarMortgageInfo carMortgageInfo optional //抵押资产信息（本条为可选之一：车抵贷）
	  o AssetData assetData //资产数据
	  o RiskControlResult riskControlResult //风控结果
	  o JoinLimit joinLimit //共享资产参与条件（分享额度/分享利率/通证费用）
	  --> CreditorContributorOrg creditorContributorOrg //贡献机构
	  o LoanShareConfirm[] loanShareConfirms optional //共享资产参与者确认信息数组
	}

关键类型transaction（交易）定义：

	//资产分享确认交易
	transaction orgConfirmAsset {
	  --> LoanSharedPlan  sharedAsset //被确认资产
	  o LoanShareConfirm loanShareConfirm //机构确认信息
	}
	
	//确认交易触发事件
	event OrgConfirmAssetEvent{
	 --> LoanSharedPlan  sharedAsset //被确认资产信息
	}

在CTO模型文件定义时，按照领域模型设计了以资产、参与者、交易为骨骼的合约架构。

资产（asset字段声明）LoanSharedPlan是为共享资产定义的类型，其作用类似于面向对象语言中的类（class），资产上链操作就是用这个类实例化一个存储在智能合约里的对象，其属性包括发起共享资产机构信息、资产详情、发起机构提出的参与条件（如额度、利率、Token数量、截止时间等），同时loanShareConfirms属性是来收集该笔资产的参与信息。

参与者（participant字段声明）creditorContributorOrg是为借贷贡献资产的机构定义的类型，其属性包括机构号、机构名称、机构Token余额和已贡献出的资产数组。creditorParticipatorOrg 为借贷资产参与机构的模型定义，其中和贡献机构不同的属性是将数组替换为已参与的资产。

交易（transaction字段声明）orgConfirmAsset 是为资产参与机构定义的类型，这个transaction会被暴露成外部可调用的API接口，通过这个接口调用智能合约来参与这笔资产，同时将触发已定义的OrgConfirmAssetEvent事件，订阅此事件的外部程序将接受到调用OrgConfirmAsset这个transaction的所有交易通知。

Hyperledger Composer会将CTO模型中的可实例化类型生成API，通过API可以增加、条件查询智能合约中的资产和参与机构。

## 合约设计

### 资产上链

借贷资产贡献机构将资产通过js-sdk/上链客户端/自主研发客户端上链，将会调用 本机构区块链节点中的智能合约（chaincode），以下为资产上链智能合约伪代码：

	//链上资产模型
	asset LoanSharedPlan identified by assetID {
	  o String assetID //共享资产ID
	  o BorrowerPerson borrowerPerson //借款基本信息
	  o CarMortgageInfo carMortgageInfo optional //抵押资产信息（本条为可选之一：车抵贷）
	  o AssetData assetData //资产数据
	  o RiskControlResult riskControlResult //风控结果
	  o JoinLimit joinLimit //共享资产参与条件（分享额度/分享利率/通证费用）
	  --> CreditorContributorOrg creditorContributorOrg //贡献机构
	  o LoanShareConfirm[] loanShareConfirms optional //共享资产参与者确认信息数组
	}

将其使用composer-rest-server生成REST API：

![使用composer-rest-server生成REST API]({{ site.imglocal }}/loan/8.png )

### 分享确认

借贷资产参与机构通过《链上资产－客户端－WEB》确认要参与借贷资产分享计划，将会调用本机构区块链节点中的智能合约（chaincode），以下为资产上链智能合约伪代码：

	/**
	 * 资产分享确认交易 transaction
	 * @param {org.tl.biznet.orgConfirmAsset} orgConfirmAsset
	 * @transaction
	 */
	function confirmAsset(orgConfirmAsset){
	        ... 
	        //发布分享确认事件
	        var  orgConfirmAssetEvent = getFactory().newEvent('org.tl.biznet','OrgConfirmAsset');  
	        emit(orgConfirmAssetEvent); 
	        ... 
	    });
	}

### 分享监听

	// 创建新的 business network 连接.
	let businessNetworkConnection = new BusinessNetworkConnection();
	
	// 订阅事件
	businessNetworkConnection.on('event', (event) => {
	  console.log('business event received', event);
	});
	
	// 连接到 business network.
	return businessNetworkConnection.connect('profile', 'biznet', 'admin', 'adminpw')
	  .then(() => {
	    ...
	  });

### 代币充值

代币充值接口由transaction 暴露API调用：

	//TOKEN充值交易
	transaction tokenRecharge {
	  --> CreditorContributorOrg  creditorContributorOrg optional //借贷资产贡献机构
	  --> CreditorParticipatorOrg  creditorParticipatorOrg optional //借贷资产参与机构
	  o Integer amount //充值金额
	}
	
	//TOKEN充值事件
	event TokenRechargeEvent{
	  --> CreditorContributorOrg  creditorContributorOrg optional //借贷资产贡献机构
	  --> CreditorParticipatorOrg creditorParticipatorOrg optional //借贷资产参与机构
	}

充值逻辑：

	/**
	 * 资产分享确认交易 transaction
	 * @param {org.tl.biznet.orgConfirmAsset} recharge 
	 */
	function tokenRecharge (recharge){
	        ... 
	        //发布充值事件
	        var  tokenRechargeEvent = getFactory().newEvent('org.tl.biznet', TokenRechargeEvent);  
	        emit(tokenRechargeEvent);   
	        ... 
	    });
	}

### 数据解密

借贷资产贡献机构接收到分享确认通知后，将数据用自身私钥解密后再用借贷资 产参与机构的公钥加密，反馈回区块链网络。借贷资产参与机构接收到用自己公钥加密到数据后，用自身私钥解密，完成借贷资产分享。

	//交易数据加密解密
	transaction dataProcessing {
	  --> CreditorContributorOrg  creditorContributorOrg optional //借贷资产贡献机构
	  --> CreditorParticipatorOrg creditorParticipatorOrg optional //借贷资产参与机构
	  --> LoanSharedPlan  sharedAsset //共享资产
	}
	
	//交易数据加密解密事件
	event DataProcessingEvent {
	  o String eventName
	  --> CreditorContributorOrg  creditorContributorOrg optional //借贷资产贡献机构
	  --> CreditorParticipatorOrg creditorParticipatorOrg optional //借贷资产参与机构
	  --> LoanSharedPlan  sharedAsset //共享资产
	}

数据加解密合约逻辑：

	/**
	 * 交易数据加密解密 transaction
	 * @param {org.tl.biznet.dataProcessing} dataProcessing
	 * @transaction
	 */
	function onDataProcessing(dataProcessing){
	        ... 
	        //发布数据加密解密事件
	        var  dataProcessingEvent = getFactory().newEvent('org.tl.biznet','dataProcessingEvent');  
	        emit(dataProcessingEvent); 
	        ... 
	    });
	}

## 单元测试

hyperledger composer单元测试和nodejs应用单元测试无太大差异；

引用官方提供的npm包：composer-admin、composer-client、composer-common，引用chai断言库;

	const AdminConnection = require('composer-admin').AdminConnection;
	const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
	const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
	const IdCard = require('composer-common').IdCard;
	const MemoryCardStore = require('composer-common').MemoryCardStore;
	const path = require('path');
	require(‘chai’).should(); 

创建一个基于内存的卡片仓库（MemoryCardStore），传入连接信息、证书和通道信息，创建一个卡片（IdCard），使用PeerAdmin账号信息进行连接，使用admin账号信息连接业务网络（BusinessNetworkConnection），使用业务网络连接对象获取工厂对象（factory）；

	const deployerCardName = 'PeerAdmin';
	        adminConnection = new AdminConnection({ cardStore: cardStore });
	        return adminConnection.importCard(deployerCardName, deployer-Card).then(() => {
	            return adminConnection.connect(deployerCardName);
	        });
	
	        return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..')).then(definition => {
	            businessNetworkDefinition = definition;
	            return adminConnection.install(businessNetworkDefinition.getName());
	        }).then(() => {
	            const startOptions = {networkAdmins: [{userName: ad-minUserName,enrollmentSecret: 'adminpw'}]};
	            return adminConnection.start(businessNetworkDefinition, startOptions);
	        }).then(adminCards => {
	            adminCardName = `${adminUserNa-me}@${businessNetworkDefinition.getName()}`;
	            return adminConnection.importCard(adminCardName, admin-Cards.get(adminUserName));
	        }).then(() => {
	            return businessNetworkConnection.connect(adminCardName);
	        });

使用工厂对象创建被确认资产和机构确认信息，创建orgConfirmAsset交易并提交到网络，并获取资产信息比对信息是否相等；

npm i && npm run test 安装npm包并运行单元测试。

## 部署视图

### 多组织安装

![部署视图]({{ site.imglocal }}/loan/9.png )


	1.图中显示了一个多组织的区块链网络；
	2.我们有四个组织（Org0，Org1，Org2，Org3）；
	3.每个组织都运行两个peer。有一个连接到kafka-zookeeper的orderer服务；
	4.我们有一个客户端，提供智能合约安装调用和维护转账等功能。

### 双Organization常规部署

![部署视图]({{ site.imglocal }}/loan/10.png )

如图所示，构建了建立了 2个Org 的5个节点的Fabric网络

	1.每个节点都是由单独的 Docker 容器来实现。
	2.其中 peer0 和 peer1 是同属于 org1 的节点，peer2 和 peer3 是同属于 org2 的节点
	3.上述它们都加入了相同的 channel 中，并在该 channel 中进行交易，3 orderer 则为该 channel 中的交易提供排序服务。

##  价值表现 

合规交易：贡献方发起的请求将在区块链上记录下来，并对请求是否完成的状态做记录，当参与方给出响应后，触发智能合约自动将对应数量的代币打给贡献方，这笔交易的详情会永久记录在区块链上。

信息真实：区块中包含了创始块以来所有的共享数据，且形成的共享记录不可篡改或虚构，任何数据都可以追本溯源，因此共享机构之间的价值交换数据可以随时被追踪和验证，保证信息的真实。

共识机制：用例中按照认领资产的速度来判断资产共享参与方。在其他场景中任然可以根据贡献、算力来决定参与资产共享的参与者。

如何保证贡献机构的借贷资产信息在没有获益前不泄漏？通过章节4.3＃2和4.4的描述解答。

如何让贡献机构高效将借贷资产上链？通过章节4.3＃1. 1《通过所在机构自有的网贷管理后台经预先植入的资产上链JS－SDK选择可以分享的借贷资产》达成。

>作者简介：付银海，泰然金融CTO，拥有17年软件研发从业经历的技术开发与技术管理专家，专精于研发团队组建和管理能力、技术设计和实现能力。

![区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [区块链在互联网借贷领域的应用探索][1]

[1]: https://blog.csdn.net/blockchain_lemon/article/details/79608778 "区块链在互联网借贷领域的应用探索" 
