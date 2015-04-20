/*
 * Event Handler
 * Fire mouse events on touch devices
 * @author Gerald <gera2ld@163.com>
 */
var EventHandler;
if('ontouchstart' in window) {
	EventHandler = function(parent) {
		var self = this;
		self.parent = parent;
		self.last = null;
		self.touches={};	// {identifier:[moved,target]}
		self.data = [];
		self.parent.addEventListener('touchstart', self.touch(), false);
		self.parent.addEventListener('touchmove', self.touch(), false);
		self.parent.addEventListener('touchend', self.touch(), false);
	};
	EventHandler.prototype = {
		threshold: 5,
		findItem: function(ele) {
			var data = this.data, i, item;
			for(i = 0; i < data.length; i ++) {
				item = data[i];
				if(item.element === ele) return item;
			}
		},
		addListener: function(ele, type, func) {
			var self = this;
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
		},
		removeListener: function(ele, type, func) {
			var self = this;
			var item = self.findItem(ele), funcs, i;
			if(item) {
				funcs = item.events[type];
				if(funcs) {
					i = funcs.indexOf(func);
					if(i >= 0) funcs.splice(i, 1);
				}
			}
		},
		ignore: function(){},
		call: function(type, e) {
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
						func(evt);
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
		touch: function() {
			var self = this;
			return function(e){
				e.preventDefault();
				if(e.type == 'touchstart')
					self.forEach(e.changedTouches, function(e) {
						self.touches[e.identifier] = [false, e];
						self.call('mousedown', e);
					});
				else if(e.type == 'touchmove')
					self.forEach(e.changedTouches, function(e) {
						var old = self.touches[e.identifier];
						self.touches[e.identifier] = [
							Math.abs(e.clientX-old.clientX) > self.threshold
							|| Math.abs(e.clientY-old.clientY) > self.threshold,
							e
						];
						self.call('mousemove', e);
					});
				else if(e.type == 'touchend')
					self.forEach(e.changedTouches, function(e) {
						self.call('mouseup',e);
						var t = self.touches[e.identifier];
						delete self.touches[e.identifier];
						if(t && !t[0])
							self.call('click', e);
					});
			};
		},
	};
} else {
	EventHandler = function(parent) {
	};
	EventHandler.prototype = {
		addListener: function(ele, type, func) {
			ele.addEventListener(type, func, false);
		},
		removeListener: function(ele, type, func) {
			ele.removeEventListener(type, func, false);
		},
	};
}
EventHandler.prototype.getPoint = function(e) {
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
};
