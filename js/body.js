/*点击后，收起nav下拉列表*/
$('#navbarcolumn a').on('click', function(){
	$('.btn-navbar').click(); //bootstrap 2.x
	$('.navbar-toggle').click() //bootstrap 3.x by Richard
});


function DetectAds(){
    innerHtml=""
    ads=document.querySelectorAll('.adsbygoogle')
    ads.forEach((ad,index,ads)=>{
        innerHtml=innerHtml+ad.innerHTML
    })
    if(innerHtml ==''){
        r=confirm('访客您好，您需要在广告屏蔽插件中排除此网站，然后点击确定')
        if (r==true){
            location.reload()
        }else{
            setTimeout(DetectAds, 5000)
        }
    }
}

setTimeout(DetectAds,5000)
