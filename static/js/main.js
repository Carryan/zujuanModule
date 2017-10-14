
/*********************按需加载***************************/ 

var VENDOR_URL = '../../vendor/';

require.config({
	baseUrl: "../../static/js/modules",
    paths: {
        treeview: VENDOR_URL+"treeview/jquery.treeview",
        treeview_cookie: VENDOR_URL+"treeview/jquery.cookie",
        vue: "../vue",
        QuestionBasket: "QuestionBasket"
    },
    shim:{
		// 'vue':{ exports:'Vue' }
	}
});

var Modules = {
	// 树形菜单
	tree: {
		elem: ".index-tree",
		fun: function(){
			require(['treeview','treeview_cookie'], function(treeview){
				var obj = $(".index-tree"); 
				obj.treeview({
			    	animated: "fast",
			    	collapsed: true,
			    	unique: true
			  	});
			  	obj.find('a').click(function(){
			    	obj.find('li').removeClass("active");
			    	$(this).parent().addClass("active");
			  	});
			});
		}
	},
	// 试题列表与试题篮
	questionBasket: {
		elem: "#search-list, #basket",
		fun: function(){
			require(['QuestionBasket'], function(qb){
				// 传入题目数据
				qb.search_list.questions = questions;
				// 检查题目是否在试题篮
				var b_qids = qb.getQid(qb.basket.questions);
				qb.search_list.checkBacketQs(b_qids);
				// 点击全选
				(function(obj){
					if (!obj.length) { return ; }
					obj.click(function(event){
						var box = $(".q-footer .btn").not(".btn-grey").first().parents(".q-box");
						if (!box.length) { return ; }
						qb.enterBasket(box);
						qb.search_list.selectAll();
					});
				})($("#select-all-qs"));
			});
		}
	},
	// 换页
	laypage: {
		elem: "#laypage",
		fun: function(){
			var ob = $("#laypage");
			layui.use(['laypage'], function(){
				var laypage = layui.laypage;
				var pages = ob.attr('data-total'),
		          	curr = ob.attr('data-curr'),
		          	link = ob.attr('data-link');
		      	laypage({
		        	cont: 'laypage'
		        	,pages: pages
		        	,curr: curr
		        	,skin: '#1c7fe2'
		        	,jump: function(obj, first){
		          		var curr = obj.curr;
		          		if(!first){
		            		window.location.href = "?p="+curr+link;
		          		}
		        	}
		      	});
			});
		}
	},
	// layui 表单
	layform: {
		elem: ".layui-form",
		fun: function(){
			layui.use(['form'], function(){
				form = layui.form();
				// ajax表单提交
				form.on('submit(ajaxSubmit)', function(data){
					var _action = $(data.form).prop('action'),
						_callback = $(this).attr('callback'),
						_form = $(this);
					$.ajax({
						url: _action,
						data: data.field,
						type: 'get',
						success: function(res){
							_callback && execStrAsCode(_callback, res);
							_form[0].reset();
						}
					});
					return false;
				});
			});
		}
	}

}

for (var i in Modules) {
	if($(Modules[i].elem).length)
		Modules[i].fun();
}


/***************************自定义******************************/ 

// 返回对象数组中存在某属性的第一个元素的位置，判断一个对象数组里是否存在某个对象
function findElem(arrayToSearch,attr,val){
    for (var i=0;i<arrayToSearch.length;i++){
        if(arrayToSearch[i][attr]==val){
            return i;
        }
    }
    return -1;
}

// 时间格式转换，fmt如：yyyy-MM-dd HH:mm:ss
function dateFormat(fmt, date) {
    if(!(date instanceof Date))
        return;
    var o = {
        "M+": date.getMonth() + 1, // 月份
        "d+": date.getDate(), //日
        "H+": date.getHours(), //24小时制
        "h+" : date.getHours()%12 == 0 ? 12 : date.getHours()%12, //12小时制 
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds()  //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
                            : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

// 执行字符串代码（暂不支持参数传json、数组）
function execStrAsCode(str, res){
	var _callback = str.match(/([\w|\.]+)(\((.*?)\))?/),
		_func = _callback[1],
		_fn = _func.split('.'),
		_arg = _callback[3] ? _callback[3].split(',') : [];
	if( _fn.length > 1 ){
		_func = window;
		$.each( _fn, function(i, f){
			_func = _func[f];
		} );
	}else{
		_func = window[_func]
	}
	_arg.push(res);
	if( (typeof _func).toLowerCase() === 'function' ){
		_func.apply(null, _arg);//继承
	}
}


// 获取当前科目
function getSubject(){
	return ("undefined" !== typeof curSubject)?curSubject:{};
}

// 本地试题篮存储，在此修改存储格式
function localBasket(subject,questions) {
	var basketQlist = [];
	for (var i = 0; i < questions.length; i++) {
		basketQlist.push({
			id: questions[i].id,
			type: questions[i].type
		});
	}

	if (!localStorage.basket_cacheObj)
	{
		localStorage.basket_cacheObj = JSON.stringify([{xd: subject.xd, xk: subject.xk, q_list: basketQlist}]);
	}
	else
	{
		var data_stored = JSON.parse(localStorage.basket_cacheObj);
		if(!data_stored.length){
			data_stored.push({xd: subject.xd, xk: subject.xk, q_list: basketQlist});
		}else{
			for (var i = 0; i < data_stored.length; i++) {
				if (data_stored[i].xd == subject.xd && data_stored[i].xk==subject.xk) {
					data_stored[i].q_list = basketQlist;
				}
			}
		}
		localStorage.basket_cacheObj = JSON.stringify(data_stored);
	}
}

// 删除本地试题篮
function delLocalBasket(subject) {
	var data_stored = JSON.parse(localStorage.basket_cacheObj);
	for (var i = 0; i < data_stored.length; i++) {
		if (data_stored[i].xd == subject.xd && data_stored[i].xk==subject.xk) {
			data_stored.splice(i,1);
		}
	}
	localStorage.basket_cacheObj = JSON.stringify(data_stored);
}

// 生成试卷，试卷格式
function makePaper(subject,qlist){

	var paper = {},
		paperName = "paper-"+subject.xd+"-"+subject.xk;
	paper.paperMain = qlist;
	paper.author = "佚名";
	paper.buildDate = dateFormat("yyyy-MM-dd H:m:s", new Date());
	paper.caution = "1、填写答题卡的内容用2B铅笔填写2、提前 xx 分钟收取答题卡";
	paper.id = Date.parse(new Date());
	paper.subTitle = subject.xkName+"考试";
	paper.subject = subject.xk;
	paper.subjectCN = subject.xkName;
	paper.timeDelay = 120;
	paper.title = dateFormat("yyyy-MM-dd", new Date())+paper.subTitle;
	paper.totalScore = 150;

	localStorage.setItem(paperName,JSON.stringify(paper));

	window.location.href = "paper.html?xd="+subject.xd+"&xk="+subject.xk;

	console.log(localStorage.getItem(paperName));
}

// 删除本地试卷
function delLocalPaper(subject){
	var paperName = "paper-"+subject.xd+"-"+subject.xk;
	localStorage.removeItem(paperName);
}