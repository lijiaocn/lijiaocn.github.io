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
        r=confirm('继续访问，需要解除对本站的广告屏蔽')
        if (r==true){
            setTimeout(DetectAds, 5000)
        }else{
            setTimeout(DetectAds, 5000)
        }
    }
}
setTimeout(DetectAds,5000)
