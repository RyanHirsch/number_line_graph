var Order = Backbone.Model.extend({
  defaults: {
    quantity: 0
  },
  initialize: function(attributes, options) {
  }
});

var Orders = Backbone.Collection.extend({
  model: Order,
  initialize: function(models, options) {
  },
  sum: function() {
    return _.reduce(this.pluck('quantity'), function(memo, num){ return memo + num; }, 0);
  }
});

var OrderColumn = Backbone.Model.extend({
  defaults: {
    label: '',
    count: 0
  }
});

var OrderColumns = Backbone.Collection.extend({
  model: OrderColumn
});

var Column = Backbone.View.extend({
  tagName: 'td',
  template: _.template(["<div class='count'><%= count %></div>",
                        "<div class='marker'></div>",
                        "<div class='label'><%= label %></div"]
                       .join('\n')),
  initialize: function(options) {
    this.render();
    this.model.on('change', this.render, this);
  },
  events: {
    'click': 'logData'
  },
  logData: function() {
    console.log('the item you clicked on is');
    console.log(this.model.get('label'));
    console.log(this.model.get('count'));

  },
  render: function() {
    var obj = {
      label: this.model.get('label'),
      count: this.colMarkup(this.model.get('count'))
    };
    this.el.innerHTML = this.template(obj);
    return this;
  },
  colMarkup: function(value) {
    var val = parseInt(value);
    var toInsert = "";
    for(var i = 0; i < val; i++) {
      toInsert += "x<br/>";
    }
    return toInsert;
  }
});

var Graph = Backbone.View.extend({
  template: _.template('<table><tr class="data-row"></tr></table>'),
  initialize: function(options) {
    this.collection.on('add', this.addData, this);
    this.collection.on('change', this.updateData, this);
    this.collection.on('destroy', this.deleteData, this);

    this.graphData = new OrderColumns();
    this.graphData.on('add', this.addColumn, this);
    
    var countObject = this.collection.countBy(function(item) {
      return item.get('quantity');
    });

    for(var key in countObject) {
      this.setData(key, countObject[key]);
    }

    this.render();
  },
  setData: function(lbl, cnt) {
    lbl = parseInt(lbl);
    var data = this.graphData.findWhere({label: lbl});
    if(data === undefined) {
      if(lbl > 1) {
        this.addIntermediateColumns(lbl);
      }
      this.graphData.add({label: lbl, count: cnt || 1});
    }
    else {
      var oldCount = data.get('count');
      data.set('count', oldCount + 1);
    }
  },
  addData: function(model) {
    var quantity = model.attributes.quantity;
    this.setData(quantity);
  },
  addIntermediateColumns: function(end) {
      var start = this.graphData.length === 0 ? 1 : this.graphData.length + 1
      for(var i = start; i < end; i++) {
        this.graphData.add({label: i, count: 0});
      }
  },
  deleteData: function(model) {
    var lbl = parseInt(model.attributes.quantity);
    var data = this.graphData.findWhere({label: lbl});
    if(data !== undefined) {
      data.set('count', data.get('count') - 1);
    }
  },
  updateData: function(model) {
    var prev = model.previousAttributes().quantity;
    var now = model.changedAttributes().quantity;
    var prevData = this.graphData.findWhere({label: prev});
    var newData = this.graphData.findWhere({label: now});

    prevData.set('count', prevData.get('count') - 1);
    if(newData === undefined) {
      this.addIntermediateColumns(now);
      this.graphData.add({label: now, count: 1});
    }
    else {
      newData.set('count', newData.get('count') + 1);
    }
  },
  addColumn: function(model) {
    var $row = this.$el.find('.data-row');
    $row.append((new Column({model: model})).el);
  },
  render: function() {
    this.el.innerHTML = this.template();
    var $row = this.$el.find('.data-row');
    this.graphData.forEach(function(columnData) {
      $row.append((new Column({model: columnData})).el);
    });
    return this;
  }
});

var orders = new Orders([{quantity: 5},{quantity: 5},{quantity: 5}]);
var graph = new Graph({el: '#main', collection: orders});
orders.add({quantity: 2});
orders.add({quantity: 1});
orders.add({quantity: 2});
orders.add({quantity: 3});
orders.add({quantity: 3});
orders.add({quantity: 5});
orders.add({quantity: 5});
orders.add({quantity: 1});

orders.last().set('quantity', 2);
orders.last().set('quantity', 1);
orders.last().set('quantity', 3);
