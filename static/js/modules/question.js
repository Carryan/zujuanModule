define(['vue'],function(Vue){
	// 题目组件
	Vue.component('question',{
		name: 'question-item',
		props: ['order_num','text','options','list'],
		template: '<div class="q-item">'+
					'<div class="q-text" v-html="order_num+text"></div>'+
					'<div v-if="options" class="q-options clfix">'+
						'<div class="op-item" v-for="(value, key) in options" ref="op">'+
							'<span class="op-item-nut">{{ key }}、</span><span class="op-item-meat" v-html="value"></span>'+
						'</div>'+
					'</div>'+
					'<div v-if="list" v-for="(item,index) in list" class="q-item">'+
						'<question-item :order_num="\'(\'+(index+1)+\')、\'" :text="item.q_text" :options="item.options" :list="item.list"></question-item>'+
					'</div>'+
				'</div>',
		mounted: function () {
			// 选项长度自适应
		  	this.$nextTick(function (e) {
		  		var ops = this.$refs.op;
		  		if(!ops) { return;}
		  		var width = 213;
		  		for(var i=0; i<ops.length; i++){
		  			var O_width = $(ops[i]).width();
		  			if(O_width>=213){
		  				width = 427;
		  			}
		  			if(O_width>=427){
		  				width = 854;
		  			}
		  			$(ops[i]).width(width);
		  		}
		  	})
		}
	});

});