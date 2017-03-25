/*淘宝联盟*/
(function(win,doc){
	var s = doc.createElement("script"), h = doc.getElementsByTagName("head")[0];
	if (!win.alimamatk_show) {
		s.charset = "gbk";
		s.async = true;
		s.src = "http://a.alimama.cn/tkapi.js";
		h.insertBefore(s, h.firstChild);
	};
	var o = {
		pid: "mm_33963329_21198259_71714722",/*推广单元ID，用于区分不同的推广渠道*/
		appkey: "",/*通过TOP平台申请的appkey，设置后引导成交会关联appkey*/
		unid: "",/*自定义统计字段*/
		type: "click" /* click 组件的入口标志 （使用click组件必设）*/
	};
	win.alimamatk_onload = win.alimamatk_onload || [];
	win.alimamatk_onload.push(o);
})(window,document);


/*点击后，收起nav下拉列表*/
$('#navbarcolumn a').on('click', function(){
	$('.btn-navbar').click(); //bootstrap 2.x
	$('.navbar-toggle').click() //bootstrap 3.x by Richard
});

/*百度搜索*/
function checkHttps () {
	BaiduHttps.useHttps();
};
function g(formname) {
	var data = BaiduHttps.useHttps();
	var url = '';
	url = data.s == 0 ? "http://www.baidu.com/baidu" : 'https://www.baidu.com/baidu' + '?ssl_s=1&ssl_c' + data.ssl_code;
	if (formname.s[1].checked) {
		formname.ct.value = "2097152";
	}
	else {
		formname.ct.value = "0";
	}
	formname.action = url;
	return true;
};

/*多麦多金链*/
var DuoMaiSiteID = 224482;
document.write(unescape("%3Cscript src='http://djl.duomai.com/index.php?site_id=" + DuoMaiSiteID + ".js' type='text/javascript'%3E%3C/script%3E"));
document.write(unescape("%3Cscript src='http://djl.duomai.com/duojinlian.js' type='text/javascript'%3E%3C/script%3E"));
try{
	var _djl_ = DuoJinLian._init_();
	_djl_.hulue('');
	_djl_.fankuibiaoqian('znr.io');
         _djl_.zhizuo('');
	_djl_.run();
}
catch(e)
{}
