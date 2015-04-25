/*
 * Event Handler
 * Fire mouse events on touch devices
 * @author Gerald <gera2ld@163.com>
 */
function EventHandler(parent) {
	var self = this;
	self.parent = parent;
	if('ontouchstart' in window) self.initTouch();
	else if('onmousedown' in window) self.mouse = true;
};
EventHandler.prototype = {
	threshold: 5,
	initTouch: function() {
		var self = this;
		var touch = self.touchHandler.bind(self);
		self.touch = true;
		self.parent.addEventListener('touchstart', touch, false);
		self.parent.addEventListener('touchmove', touch, false);
		self.parent.addEventListener('touchend', touch, false);
		self.touches={};	// {identifier:{moved,target}}
		self.data = [];
	},
	findItem: function(ele) {
		var data = this.data, i, item;
		for(i = 0; i < data.length; i ++) {
			item = data[i];
			if(item.element === ele) return item;
		}
	},
	addListener: function(ele, type, func) {
		var self = this;
		if(self.mouse)
			ele.addEventListener(type, func, false);
		if(self.touch) {
			var item = self.findItem(ele);
			if(item) {
				i = item.events[type];
			} else {
				item = {
					element: ele,
					events: {},
				};
				self.data.push(item);
				i = null;
			}
			if(!i) item.events[type] = i = [];
			i.push(func);
		}
	},
	removeListener: function(ele, type, func) {
		var self = this;
		if(self.mouse)
			ele.removeEventListener(type, func, false);
		if(self.touch) {
			var item = self.findItem(ele), funcs, i;
			if(item) {
				funcs = item.events[type];
				if(funcs) {
					i = funcs.indexOf(func);
					if(i >= 0) funcs.splice(i, 1);
				}
			}
		}
	},
	ignore: function(){},
	fire: function(type, e) {
		var self = this;
		var callTarget = function(target) {
			var i, item = null;
			for(i = 0; i < self.data.length; i ++) {
				if(self.data[i].element === target) {
					item = self.data[i];
					break;
				}
			}
			if(item) {
				var funcs = item.events[type];
				if(funcs) self.forEach(funcs, function(func) {
					var evt = {type: type}, i;
					for(i in e) evt[i] = e[i];
					evt.preventDefault = self.ignore;
					evt.stopPropagation = stopPropagation;
					func.call(target, evt);
				});
			}
		};
		var propagationStopped = false;
		var stopPropagation = function() {
			propagationStopped = true;
		};
		var target = e.target;
		while(target) {
			callTarget(target);
			if(propagationStopped || target === self.parent) break;
			target = target.parentNode;
		}
	},
	forEach: function(arr, callback) {
		Array.prototype.forEach.call(arr, callback);
	},
	touchHandler: function(e) {
		var self = this;
		e.preventDefault();
		if(e.type == 'touchstart')
			self.forEach(e.changedTouches, function(e) {
				self.touches[e.identifier] = {evt: e};
				self.fire('mousedown', e);
			});
		else if(e.type == 'touchmove')
			self.forEach(e.changedTouches, function(e) {
				var touch = self.touches[e.identifier];
				var old = touch.evt;
				touch.moved = touch.moved || (
					Math.abs(e.clientX - old.clientX) > self.threshold ||
					Math.abs(e.clientY - old.clientY) > self.threshold
				);
				if(touch.moved) {
					touch.evt = e;
					self.fire('mousemove', e);
				}
			});
		else if(e.type == 'touchend')
			self.forEach(e.changedTouches, function(e) {
				self.fire('mouseup',e);
				var touch = self.touches[e.identifier];
				delete self.touches[e.identifier];
				if(touch && !touch.moved)
					self.fire('click', e);
			});
	},
	getPoint: function(e) {
		if('offsetX' in e) return {
			x: e.offsetX,
			y: e.offsetY,
		};
		var rect = e.target.getBoundingClientRect();
		var docEle = document.documentElement;
		var win = window;
		return {
			x: e.pageX - (rect.left + win.pageXOffset - docEle.clientLeft),
			y: e.pageY - (rect.top + win.pageYOffset - docEle.clientTop),
		};
	},
};
