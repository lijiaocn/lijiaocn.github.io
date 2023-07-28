/*点击后，收起nav下拉列表*/
$('#navbarcolumn a').on('click', function(){
	$('.btn-navbar').click(); //bootstrap 2.x
	$('.navbar-toggle').click() //bootstrap 3.x by Richard
});

/* Google 已经支持广告挽回消息
function DetectAds(){
    innerHtml=""
    ads=document.querySelectorAll('.adsbygoogle')
    ads.forEach((ad,index,ads)=>{
        innerHtml=innerHtml+ad.innerHTML
    })
    if(innerHtml ==''){
        r=confirm('解除广告插件对对本站屏蔽!')
        if (r==true){
            setTimeout(DetectAds, 30000)
        }else{
            setTimeout(DetectAds, 30000)
        }
    }
}
setTimeout(DetectAds,20000)
*/

/*Google 广告拦截收入挽回代码*/
<script async src="https://fundingchoicesmessages.google.com/i/pub-8176866190626448?ers=1" nonce="9DYNtNbey7d75wS-aLUAUQ"></script><script nonce="9DYNtNbey7d75wS-aLUAUQ">(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();</script>
