// ajax加载公共部分
$.ajax({
	url: '../Public/header.html',
	async: false,
	success: function(res){ $('#header').prop('outerHTML',res); }
});

$.ajax({
	url: '../Public/footer.html',
	async: false,
	success: function(res){ $('#footer').prop('outerHTML',res); }
});


// 选择科目,鼠标经过
(function(obj){
	if (!obj.length) { return ; }

	var i = null;
	obj.parent().on("mouseover",function(){
		obj.show(),i&&clearTimeout(i),i=null;
	}).on("mouseout",function(){
		return !i&&void(i=setTimeout(function(){obj.hide()},500));
	});

})($(".subject-select"));

//日期选择器
(function ($date) {
  if (!$date[0]) return;
  layui.use('laydate', function () {
    var laydate = layui.laydate;
    $date.each(function () {
      
      var $this = $(this),
        format = $this.attr('format') || 'yyyy-MM-dd',
        type = 'date';
      $.each(['time', 'month', 'year', 'datetime'], function (i, el) {
        if ($this.is('.js-' + el)) {
          type = el;
          return false;
        }
      });
      laydate.render({
        elem: this
        , theme: '#1c7fe2'
        , type: type
        , format: format
      });
    });
  });
})($('input.js-date, input.js-year, input.js-time, input.js-month, input.js-datetime'));



/*********************组卷页*************************/ 

// 修正密封线高度
(function autoFixedBuilder (element) {

	if (!element.length) { return; }
	
  function fixSize () {
    setTimeout(function () {
      element.find('#sealine').height(element.find('#mainbox').height());
    });
  }
  // 页面载入及试卷对象发生改变时调整密封线高度
  window.addEventListener('load', fixSize);
  document.addEventListener('mainbox-size-changed', fixSize);

})($('#paper'));


// 弹框
(function setPopboxMovable (element) {
})($('#popBox'));


// 文本修改
(function modifyText () {
})();


// 侧边栏
(function autoFixedSidebar (element) {

	if (!element.length) { return; }

  var $btnFold = $('button.btn-fold');
  var $wrapper = $('#sidebar div.wrapper');
  var $statsWrapper = $('#statsBox div.wrapper');
  var sidebarOffsetTop = element.offset().top;
  
  // 获取侧边栏内容初始高度
  var originSideColumnHeight = (function () {
    var params = {};
    $wrapper.each(function(index, el) {
      params[$(el).parents('div').prop('id')] = $(el).height();
    });
    return params;
  })();

  // 侧边栏固定
  function fixedSidebar () {
    $(document).scrollTop() > sidebarOffsetTop ? element.addClass('fixed') : element.removeClass('fixed');
  }

  // 修正试题统计高度
  function setStatsHeight () {
    var winHeight = $(window).height();
    var sidebarHeight = element.height();
    var statsInnerHeight = $statsWrapper.height();

    if (sidebarHeight > winHeight) {
      $statsWrapper.css({
        'overflow-x': 'auto',
        'height': statsInnerHeight - (sidebarHeight - winHeight),
      });
    } else if ((sidebarHeight + (originSideColumnHeight.statsBox - statsInnerHeight)) < winHeight && statsInnerHeight !== 0) {
      $statsWrapper.css({
        'height': originSideColumnHeight.statsBox,
      });
    } else if (sidebarHeight < winHeight && statsInnerHeight !== 0) {
      $statsWrapper.css({
        'height': statsInnerHeight - (sidebarHeight - winHeight),
      });
    }
  }

  // 侧边栏收起展开
  (function foldUpSidebarColumn () {

    var originHeight = {};
    var isActive = true;
    var speed = 200;

    $btnFold.on('click', function (event) {

      if (isActive) {
        var $sidebarColumn = $(this).parents().children('.wrapper');
        var originHeight = originSideColumnHeight[$($(this).parents('div')[0]).prop('id')];
        var winHeight = $(window).height();
        var sideNewHeight = $('#sidebar').height();

        $sidebarColumn.height() == 0 ?
          ($sidebarColumn.animate({'height': originHeight}, speed, setStatsHeight), $(this).text('收起'))
          : ($sidebarColumn.animate({'height': '0'}, speed, setStatsHeight), $(this).text('展开'));

        isActive = false;
        setTimeout(function () {
          isActive = true;
        }, speed + 100);
        
      } // End if

    });
  })();

  window.addEventListener('load', setStatsHeight);
  window.addEventListener('resize', setStatsHeight);
  document.addEventListener('scroll', fixedSidebar);

})($('#sidebar'));
