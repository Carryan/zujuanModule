(function paperModule (element) {

  var origin = 'http://' + window.location.host;
  var urlQuestionDatas = origin + '/static/data/datas.json';
  var log = console.log.bind(console);
  var warn = console.warn.bind(console);
  var dev = true;
  var doc = document;

  window.SPaper = new Vue({

    el: element[0],

    data: {
      Obj: null,
      Popbox: {},
      dragging: false,
      stats: {},
      sidebar: {
        statistics: false,
      }
    },

    // Vue实例化时加载试卷数据
    created: function () {
      // 使用 window.localStorage, IE8+
      if (localStorage.hasOwnProperty('paper')) {
        log('[SPaper:localStorage]', 'Reading...');
        this.initPaper(JSON.parse(localStorage.getItem('paper')));
      } else {
        var self = this;
        // 使用 ajax 加载数据
        $.ajax({
          url: '../../static/data/paper.json',
          async: false,
          success: function (responseJson) {
            self.initPaper(responseJson);
          },
        });

        return warn('[SPaper:WARN] There is no paper in localStorage:', localStorage);
      }
    },

    watch: {
      Obj: {
        deep: true,
        handler: function () {
          dev ? log('[SPaper:Obj]', this.Obj) : null;
          this.analysis();
          this.computeSeqNumber();
          this.freshStyle();

          // 试卷数据发生变化时抛出事件
          var event = doc.createEvent('Event');
          event.initEvent('mainbox-size-changed', true, true);
          document.dispatchEvent(event);
        }
      },
      Popbox: {
        deep: true,
        handler: function () {
          dev ? log('[SPaper:Popbox]', this.Popbox): null;
          this.analysis();

          // 弹窗发生变化时抛出事件
          if (this.Popbox.isShow) {
            var event = doc.createEvent('Event');
            event.initEvent('popbox-show', true, true);
            document.dispatchEvent(event);
          }
        }
      },
      stats: {
        deep: true,
        handler: function () {
          dev ? log('[SPaper:Stats]', this.stats) : null;
        }
      }
    },

    methods: {
      initPaper: function (object) {
        if (object) {
          this.Obj = object;
        }
        // 试卷无结构样式时添加样式
        if (!object.style) {
          var items = ['sealine', 'rating', 'mainTitle', 'mainTitle', 'subTitle', 'caution', 'partVol',
            'timeDelay', 'notice', 'examinee', 'partBig', 'totalRate', 'bigNotice'];

          this.$set(this.Obj, 'style', {});
          for (var i = 0; i < items.length; i++) {
            this.$set(this.Obj.style, items[i], true);
          }
          this.save();
        }
        // 试卷无结构模板时添加模板
        if (!object.template) {
          this.Obj.template = 'standard';
        }
        // 计算试卷题目的初始序号
        this.computeSeqNumber();
        // 统计试卷各项数据
        this.analysis();
      },
      freshStyle: function () {
        // 设置需要隐藏的试卷结构
        var styles = this.Obj.style;
        log(styles);
        for (var selector in styles) {
          var elements = document.getElementsByClassName(selector.replace(/([A-Z])/g, '-$1').toLowerCase());
          if (elements) {
            for (var i = 0; i < elements.length; i++) {
              elements[i].style.display = styles[selector] ? '' : 'none';
            }
          }
        }
      },
      resetStyle: function() {
        var styles = this.Obj.style;
        for (var item in styles) {
          this.$set(this.Obj.style, item, true);
        }
      },
      toggleTemplate: function(evt) {
        var template = {
          tmpStandard: ['sealine', 'rating', 'notice', 'partVol'],
          tmpPractice: ['sealine', 'rating', 'subTitle', 'caution', 'partVol', 'timeDelay', 'notice', 'examinee', 'totalRate'],
          tmpExam: []
        }
        var target = template[evt.target.id];
        this.resetStyle();
        for (var i = 0; i < target.length; i++) {
          this.$set(this.Obj.style, target[i], false);
        }
      },
      computeSeqNumber: function () {
        var main = this.Obj.paperMain;
        for (var i = 0, seq = 1; i < main.length; i++) {
          for (var j = 0; j < main[i].questions.length; j++, seq++) {
            main[i].questions[j].seqNum = seq;
          }
        }
      },
      toUpperNumber: function (num) {
        var Ch = {
          '0': '\u96f6', '1': '\u4e00', '2': '\u4e8c', '3': '\u4e09',
          '4': '\u56db', '5': '\u4e94', '6': '\u516d', '7': '\u4e03',
          '8': '\u516b', '9': '\u4e5d', '10': '\u5341', 'null': ''
        };
        return ( num > 0 && num < 100 ) ?
          Math.floor(num/10) ?
            Ch[Math.floor(num/10) === 1 ? 'null' : Math.floor(num/10)]+'\u5341'
            +Ch[Math.floor(num%10) === 0 ? 'null' : Math.floor(num%10)]
          : Ch[Math.floor(num%10)]
        : null
      },
      replaceLineFeed: function (str) {
        return str == null ? '' : str.replace(/\n/g, '<br>');
      },
      showTextBar: function (evt) {
        var self = this;
        var $main = $('#paperMain');
        // console.log(evt)

        if (evt.target.tagName.toLowerCase() === 'span' || evt.target.tagName.toLowerCase() === 'div') {
          // 重置所有<input>的状态
          $main.find('input, textarea').hide().prev('span, div').show();
          $(evt.target).hide().next('input, textarea').show().focus();

          // <input>区域外点击关闭输入状态
          $(document).show().on('mousedown', function (e) {
            var _target = $(evt.target).next('input, textarea');
            if (!_target.is(e.target)) {
              $(evt.target).show().next('input, textarea').hide();
            }
          });
        }
      },
      analysis: function () {
        this.stats.totalScore = 0;
        this.stats.amount = 0;
        var difficulty = 0;

        var params = {};
          params.len = {},
          params.score = {};

        var main = this.Obj.paperMain;
        
        for (var i = 0; i < main.length; i++) {
          params.score[i] = 0;
          params.len[i] = main[i].questions.length;
          for (var j = 0; j < main[i].questions.length; j++) {
            params.score[i] += parseFloat(main[i].questions[j].score);
            difficulty += parseFloat(main[i].questions[j].difficulty)
            this.stats.amount++;
          }
          this.stats.totalScore += params.score[i];
        }

        this.stats.volume = main.length;
        this.stats.eachVolume = params;
        this.stats.difficulty = (difficulty / this.stats.amount).toFixed(2);;
      },
      /**
       * 弹框
       */
      initPopBox: function (el, type, options) {
        this.Popbox = {};
        this.Popbox.el = el;
        this.Popbox.type = type || 'unset';
        this.$set(this.Popbox, 'options', options);
        this.showPopBox();
      },
      showPopBox: function () {
        this.Popbox.isShow = true;
      },
      hidePopBox: function () {
        this.Popbox = {};
        this.Popbox.isShow = false;
      },
      /**
       * 更新数据，关闭弹框
       */
      updatePaper: function () {
        // 修改分数
        if (this.Popbox.type === 'single' || this.Popbox.type === 'multiple') {
          var val = parseFloat($('#setScore').val());
          if (!/^\d+\.?\d*$/.test(val)) {
            this.hidePopBox();
            return;
          }
          if (this.Popbox.type === 'single') {
            this.Popbox.el.score = val;
          }
          else if (this.Popbox.type === 'multiple') {
            var ques = this.Popbox.el.questions;
            for (var i = 0; i < ques.length; i++) {
              ques[i].score = val;
            }
          }
        }
        // 删除
        if (this.Popbox.type === 'delete') {
          var _obj = this.Obj;
          if (this.Popbox.options.innerIndex || this.Popbox.options.innerIndex === 0) {
            _obj.paperMain[this.Popbox.options.outerIndex].questions.splice(this.Popbox.options.innerIndex, 1);
          } else {
            _obj.paperMain.splice(this.Popbox.options.outerIndex, 1);
          }
          this.analysis();
        }
        // 排序
        if (this.Popbox.type === 'sort') {
          var index = 0;
          for (var sortableItem in this.Popbox.options.sortable) {
            if (!this.Popbox.options.sortable[sortableItem]) {
              index++;
              continue;
            } else {
              var _el = this.Obj.paperMain[index].questions;
              var self = this;
              var quickSort = function (_el) {
                if (_el.length <= 1) return _el;
                var pivotIndex = Math.floor(_el.length / 2);
                var pivot = _el.splice(pivotIndex, 1)[0];
                var l = [];
                var r = [];
                for (var i = 0; i < _el.length; i++) {
                  if (self.Popbox.options.sortType === 'easyToHard' ?
                    (_el[i].difficulty < pivot.difficulty) : (_el[i].difficulty > pivot.difficulty)
                  ) {
                    l.push(_el[i]);
                  } else {
                    r.push(_el[i]);
                  }
                }
                return quickSort(l).concat([pivot], quickSort(r));
              }
              this.Obj.paperMain[index].questions = quickSort(_el);
              index++;
            }
          }
          index = null;
        }

        // 纠错
        if (this.Popbox.type === 'feedback') {
          // TODO
        }

        // 转移
        if (this.Popbox.type === 'transfer') {
          if (!this.Popbox.options.selected) {
            this.hidePopBox();
            return;
          } else {
            var _obj = this.Obj;
            var target = this.Popbox.options.selected;
            var cloneObj = this.Popbox.el;
            _obj.paperMain[this.Popbox.options.outerIndex].questions.splice(this.Popbox.options.innerIndex, 1);
            for (var i = 0; i < _obj.paperMain.length; i++) {
              if (_obj.paperMain[i].type !== target) {
                continue;
              } else {
                _obj.paperMain[i].questions.push(cloneObj);
              }
            }
          }
        }

        // 下载
        if (this.Popbox.type === 'download') {
          // $.ajax(postAjaxOptions);
        }

        this.hidePopBox();
      },
      /**
       * 设置分数
       */
      setScore: function (el, type, evt) {
        this.initPopBox(el, type, {
          title: evt.target.innerHTML,
          size: 'sm',
          score: el.score,
          seqNum: el.seqNum,
        });
      },
      setSingleScore: function (el, index, evt) {
        var type = 'single';
        this.setScore(el, type, evt);
      },
      setMultipleScore: function (el, index, evt) {
        var type = 'multiple';
        this.setScore(el, type, evt);
      },
      /**
       * 删除试题
       */
      deleteItem: function (el, outerIndex, innerIndex) {
        this.initPopBox(el, 'delete', {
          title: '删除',
          size: 'sm',
          outerIndex: outerIndex,
          innerIndex: innerIndex,
        });
      },
      /**
       * 排序试题
       */
      sortItem: function (el, outerIndex, innerIndex) {
        var self = this;
        this.initPopBox(el, 'sort', {
          title: '排序',
          size: 'lg',
          index: outerIndex,
          sortable: function () {
            var params = {}
            for (var i = 0; i < self.Obj.paperMain.length; i++) {
              params[self.Obj.paperMain[i].type] = self.Obj.paperMain[i].type === el.type ? true : false;
            }
            return params;
          }(),
          sortType: 'easyToHard',
        });
      },
      /**
       * 纠错试题
       */
      feedback: function (el) {
        this.initPopBox(el, 'feedback', {
          title: '纠错试题',
          size: 'lg',
        });
      },
      /**
       * 转移试题
       */
      transfer: function (el, outerIndex, innerIndex) {
        var self = this;
        this.initPopBox(el, 'transfer', {
          title: '转移试题',
          size: 'lg',
          selected: null,
          outerIndex: outerIndex,
          innerIndex: innerIndex,
        });
      },

      checkNumber: function (evt) {
        evt.target.value === '' ? evt.target.value = 0 : null;
      },

      changeItem: function (item, outerIndex, innerIndex) {
        var self = this;
        var obj = this.Obj;
        var newItem = {};

        $.ajax({
          url: urlQuestionDatas,
          dataType: 'json',
          success: function (data) {
            var len = data.length;
            var i = Math.floor(Math.random() * len);
            if (data[i].id === item.id) {
              i === len-1 ? i-- : i++;
            }
            newItem = data[i];
            obj.paperMain[outerIndex].questions.splice(innerIndex, 1, newItem);
          }
        });
      },

      download: function () {
        this.initPopBox(null, 'download', {
          title: '下载word试卷',
          size: 'lg',
        });
      },

      favorite: function () {
        //TODO
      },

      save: function () {
        try {
          log('[SPaper:localStorage]', 'Saving...');
          localStorage.setItem('paper', JSON.stringify(this.Obj));
        } catch (err) {
          warn('[SPaper:localStorage]', 'Save failed:', err);
        }
      },

      savePaper: function () {
        var self = this;
        var times = 3;

        this.initPopBox(null, 'save', {
          title: '保存试卷',
          size: 'lg',
          times: times,
        });

        var timer = setInterval(function () {
          if (self.Popbox.options === undefined) {
            clearInterval(timer);
          } else {
            self.Popbox.options.times--;
            if (self.Popbox.options.times === 0) {
              self.hidePopBox();
              clearInterval(timer);
            }
          }
        }, 1000);

        this.save();
      },

      load: function (callback) {
        callback();
      },

      destroyPaper: function () {
        this.Obj = {};
      }
    }
  });

})($('#paper'));