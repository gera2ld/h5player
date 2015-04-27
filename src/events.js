/**
 * Event Handler
 * Fire mouse events on touch devices
 * @author Gerald <gera2ld@163.com>
 */
'use strict';

// es6: Array.prototype.find
if(typeof Array.prototype.find === 'undefined')
	Array.prototype.find = function(callback) {
		var list = this;
		for(var i = 0; i < list.length; i ++) {
			var item = list[i];
			if(callback(item, i, list))
				return item;
		}
	};

function Events() {
	this.data = [];
}
Events.prototype = {
	getCallbacks: function(element, type, useCap, setdefault) {
		var item = this.data.find(function(value, index, arr) {
			return value.element === element;
		});
		if(!item) {
			if(!setdefault) return;
			item = {
				element: element,
				events: [{}, {}],
			};
			this.data.push(item);
		}
		var events = item.events[useCap?1:0];
		var callbacks = events[type];
		if(!callbacks&&setdefault) events[type] = callbacks = [];
		return callbacks;
	},
	add: function(element, type, callback, useCap) {
		var callbacks = this.getCallbacks(element, type, useCap, true);
		callbacks.push(callback);
	},
	remove: function(element, type, callback, useCap) {
		var callbacks = this.getCallbacks(element, type, useCap);
		if(callbacks) {
			var i = callbacks.indexOf(callback);
			if(i >= 0) callbacks.splice(i, 1);
		}
	},
	forEachEvent: function(callback) {
		this.data.forEach(function(item) {
			function walk(events, useCap) {
				for(var type in events) {
					var funcs = events[type];
					funcs.forEach(function(func) {
						callback(item.element, type, func, useCap);
					});
				}
			}
			walk(item.events[0], false);
			walk(item.events[1], true);
		});
	},
};

function EventHandler(parent) {
	var self = this;
	self.parent = parent;
	self.dataEvent = new Events();
	if('ontouchstart' in window) self.initTouch();
	else if('onmousedown' in window) self.mouse = true;
};
EventHandler.prototype = {
	threshold: 5,
	initTouch: function() {
		var self = this;
		var touch = self.touchHandler.bind(self);
		self.touch = true;
		self.dataTouch = new Events();
		self.on(self.parent, 'touchstart', touch);
		self.on(self.parent, 'touchmove', touch);
		self.on(self.parent, 'touchend', touch);
		self.touches={};	// {identifier:{moved,target}}
	},
	on: function(ele, type, func, useCap) {
		this.dataEvent.add(ele, type, func, useCap);
		ele.addEventListener(type, func, useCap);
	},
	off: function(ele, type, func, useCap) {
		this.dataEvent.remove(ele, type, func, useCap);
		ele.removeEventListener(type, func, useCap);
	},
	delegate: function(ele, type, func, useCap) {
		var self = this;
		if(self.mouse)
			self.on(ele, type, func, useCap);
		if(self.touch)
			self.dataTouch.add(ele, type, func, useCap);
	},
	undelegate: function(ele, type, func, useCap) {
		var self = this;
		if(self.mouse)
			self.off(ele, type, func, useCap);
		if(self.touch)
			self.dataTouch.remove(ele, type, func, useCap);
	},
	ignore: function(){},
	forEach: function(arr, callback) {
		Array.prototype.forEach.call(arr, callback);
	},
	fire: function(type, e) {
		var self = this;
		var callTarget = function(target) {
			var callbacks = self.dataTouch.getCallbacks(target, type);
			if(callbacks) self.forEach(callbacks, function(func) {
				var evt = {type: type}, i;
				for(i in e) evt[i] = e[i];
				evt.preventDefault = self.ignore;
				evt.stopPropagation = stopPropagation;
				func.call(target, evt);
			});
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
	destroy: function() {
		var self = this;
		self.dataEvent.forEachEvent(function(element, type, func, useCap) {
			element.removeEventListener(type, func, useCap);
		});
		self.dataTouch = null;
		self.dataEvent = null;
	},
};
