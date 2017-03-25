/*百度统计*/
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?8028c12024c7e410bf4ccc38cc8ca298";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();


/*百度自动收录*/
(function(){
    var bp = document.createElement('script');
    var curProtocol = window.location.protocol.split(':')[0];
    if (curProtocol === 'https') {
        bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';        
    }
    else {
        bp.src = 'http://push.zhanzhang.baidu.com/push.js';
    }
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(bp, s);
})();

/*360自动收录*/
(function(){
   var src = (document.location.protocol == "http:") ? "http://js.passport.qihucdn.com/11.0.1.js?f94b16f3885b8650f1ba17fd97d5bb72":"https://jspassport.ssl.qhimg.com/11.0.1.js?f94b16f3885b8650f1ba17fd97d5bb72";
   document.write('<script src="' + src + '" id="sozz"><\/script>');
})();
