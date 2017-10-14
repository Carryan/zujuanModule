define(['vue','question'],function(Vue){
	// 首页题目列表
	var search_list = new Vue({
		el: '#search-list',
		data:{
			questions: []
		},
		methods:{
			// 加入试题篮
			toggleBasket: function(event,key){
				var question = this.questions[key];
				if(!question.isBasket){
					// 动画
					var $this = $(event.currentTarget);
					var	box = $this.parents('.q-box');
					enterBasket(box);
					// 更新数据
					basket.questions.push(question);
					basket.updateLocalBasket();
				}else{
					var q_ids = [question.id];
					this.delQuestion(q_ids);
				}
			},
			// 全选
			selectAll: function(){
				for (var i = 0; i < this.questions.length; i++) {
					if (this.questions[i].isBasket===false) {
						basket.questions.push(this.questions[i]);
						basket.updateLocalBasket();
					}
				}
			},
			// 移除已选试题,q_ids为要移除的试题的id数组
			delQuestion: function(q_ids){
				for (var i = 0; i < q_ids.length; i++) {
					var postion = findElem(basket.questions,'id',q_ids[i]);
					if (postion>=0) {
						basket.questions.splice(postion,1);
					}
				}
				basket.updateLocalBasket();
			},
			// 纠错
			correct: function(q_id){
				layui.layer.open({
			      	title: '纠错试题',
			      	type: 1,
			      	content: $('.correct-box'),
			      	skin: 'layer-primary',
			      	area: ['490px', '372px'],
			      	shade: 0.5,
			      	resize : false,
			      	btn: ['确定', '取消'],
			      	yes: function(index, layero){
			      		$(".correct-box form").attr('callback', 'layer.close('+index+')');
			      		$(".correct-box form input").val(q_id);
			            $(".correct-box form .submit").click();
			        },
			        btn2: function(index, layero){
			            layer.close(index);
			        }
				});
			},
			// 检查试题是否已在试题篮中
			checkBacketQs: function(b_qids) {
				var _this = this;
				_this.questions.forEach(function(v){
					if (b_qids.indexOf(v.id)>=0) {
						_this.$set(v, 'isBasket', true);
					}else{
						_this.$set(v, 'isBasket', false);
					} 
				});
			}

		}
	});

	var basket = new Vue({
		el: '#basket',
		data: {
			isActive: true,
			subject: getSubject(),
			questions: getBacketQs(),
			list: []
		},
		computed: {
			// 统计题目类型
			getList: function() {
				this.list = []; 
				for (var i = 0; i < this.questions.length; i++) {
					var position = findElem(this.list,'type',this.questions[i].type);
					if (position>=0) {
						this.list[position].q_ids.push(this.questions[i].id);
					}else{
						this.list.push({
							type:this.questions[i].type, q_ids: [this.questions[i].id]
						});
					}
				}
				return this.list;
			}
		},
		methods: {
			// 清空试题篮
			clearBasket: function(){
				var q_ids = getQid(this.questions);
				q_ids.length && layer.confirm('你确定要清空试题篮吗?', {title:'删除',area:['340px', '295px'],skin:'layer-sm',resize:false}, function(index){
				  	search_list.delQuestion(q_ids);
				  	layer.close(index);
				});      
			},
			// 清空题型
			clearType: function(item){
				layer.confirm('你确定要删除"'+item.type+'"吗?', {title:'删除',area:['340px', '295px'],skin:'layer-sm',resize:false}, function(index){
				  	search_list.delQuestion(item.q_ids);
				  	layer.close(index);
				});     
			},
			// 更新本地试题篮
			updateLocalBasket: function(){
				var subject = this.subject,
					questions = this.questions;
				if (!subject) { layer.msg('请选择科目'); return false;}
				localBasket(subject,questions);
				var q_ids = getQid(questions);
				search_list.checkBacketQs(q_ids);
			},
			// 生成试卷
			buildPaper: function(){
				if(this.list.length<1){
					layer.msg('请选择试题');
					return false;
				}
				if (!this.subject) { layer.msg('请选择科目'); return false;}
				makePaper(this.subject,this.list);
			}
			
		}
	});

	// 选题动画
	function enterBasket(question_box){
		var	box_offset = question_box.offset(),
			cart_offset = $(".basket .icon-shopcart").offset(),
			box_clone = question_box.clone();
		box_clone.addClass('q-box-clone').appendTo('body').css(box_offset);
		box_clone.animate({
		    left: cart_offset.left,
		    top: cart_offset.top,
		    width: '20px',
		    height: '20px'
		},function(){
			$(this).remove();
		});
	}

	// 从本地获取当前试题篮的试题
	function getBacketQs(){
		var data_stored = localStorage.basket_cacheObj?JSON.parse(localStorage.basket_cacheObj):[];
		var qs = [], cs = getSubject();
		for (var i = 0; i < data_stored.length; i++) {
			if(data_stored[i].xd == cs.xd && data_stored[i].xk==cs.xk){
				qs = data_stored[i].q_list;
			}
		}
		return qs;
	}

	// 获取试题id的数组
	function getQid(questions){
		var q_ids = [];
		for (var i = 0; i < questions.length; i++) {
			q_ids.push(questions[i].id);
		}
		return q_ids;
	}

	return {
		search_list: search_list,
		basket: basket,
		enterBasket: enterBasket,
		getQid: getQid
	};

});