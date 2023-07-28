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
