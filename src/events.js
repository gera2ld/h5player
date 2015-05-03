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
	self.events = new Events();
	self.delegates = new Events();
	self.handler = self._handler.bind(self);
	if('ontouchstart' in window) self.initTouch();
	if('onmousedown' in window) self.initMouse();
};
EventHandler.prototype = {
	threshold: 5,
	initTouch: function() {
		var self = this;
		var handler = self.handler;
		self.touches={};	// {identifier:{moved,target}}
		self.on(self.parent, 'touchstart', handler);
		self.on(self.parent, 'touchmove', handler);
		self.on(self.parent, 'touchend', handler);
	},
	initMouse: function() {
		var self = this;
		var handler = self.handler;
		self.mouse = {};	// {moving:false,moved:false}
		self.on(self.parent, 'mousedown', handler);
		self.on(self.parent, 'mousemove', handler);
		self.on(self.parent, 'mouseup', handler);
	},
	on: function(ele, type, func, useCap) {
		this.events.add(ele, type, func, useCap);
		ele.addEventListener(type, func, useCap);
	},
	off: function(ele, type, func, useCap) {
		this.events.remove(ele, type, func, useCap);
		ele.removeEventListener(type, func, useCap);
	},
	delegate: function(ele, type, func, useCap) {
		this.delegates.add(ele, type, func, useCap);
	},
	undelegate: function(ele, type, func, useCap) {
		this.delegates.remove(ele, type, func, useCap);
	},
	forEach: function(arr, callback) {
		Array.prototype.forEach.call(arr, callback);
	},
	fire: function(type, e) {
		var self = this;
		var callTarget = function(target) {
			var callbacks = self.delegates.getCallbacks(target, type);
			if(callbacks) self.forEach(callbacks, function(func) {
				var evt = {type: type}, i;
				for(i in e) evt[i] = e[i];
				evt.preventDefault = preventDefault;
				evt.stopPropagation = stopPropagation;
				func.call(target, evt);
			});
		};
		var defaultPrevented = false;
		var propagationStopped = false;
		var preventDefault = function() {
			defaultPrevented = true;
		};
		var stopPropagation = function() {
			propagationStopped = true;
		};
		var target = e.target;
		while(target) {
			callTarget(target);
			if(propagationStopped || target === self.parent) break;
			target = target.parentNode;
		}
		return defaultPrevented;
	},
	_handler: function(e) {
		var self = this;
		var touches = self.touches;
		var mouse = self.mouse;
		var defaultPrevented = false;
		if(e.type == 'touchstart')
			self.forEach(e.changedTouches, function(e) {
				touches[e.identifier] = {evt: e};
				defaultPrevented = self.fire('mousedown', e) || defaultPrevented;
			});
		else if(e.type == 'touchmove')
			self.forEach(e.changedTouches, function(e) {
				var touch = touches[e.identifier];
				var old = touch.evt;
				touch.moved = touch.moved || (
					Math.abs(e.clientX - old.clientX) > self.threshold ||
					Math.abs(e.clientY - old.clientY) > self.threshold
				);
				if(touch.moved) {
					touch.evt = e;
					defaultPrevented = self.fire('mousemove', e) || defaultPrevented;
				}
			});
		else if(e.type == 'touchend')
			self.forEach(e.changedTouches, function(e) {
				defaultPrevented = self.fire('mouseup',e) || defaultPrevented;
				var touch = touches[e.identifier];
				delete touches[e.identifier];
				if(touch && !touch.moved)
					defaultPrevented = self.fire('click', e) || defaultPrevented;
			});
		else if(e.type == 'mousedown') {
			mouse.moving = true;
			mouse.moved = false;
			defaultPrevented = self.fire('mousedown', e) || defaultPrevented;
		} else if(e.type == 'mousemove') {
			if(mouse.moving) {
				mouse.moved = true;
				defaultPrevented = self.fire('mousemove', e) || defaultPrevented;
			}
		} else if(e.type == 'mouseup') {
			mouse.moving = false;
			defaultPrevented = self.fire('mouseup', e) || defaultPrevented;
			if(!mouse.moved)
				defaultPrevented = self.fire('click', e) || defaultPrevented;
		}
		if(defaultPrevented) e.preventDefault();
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
		self.events.forEachEvent(function(element, type, func, useCap) {
			element.removeEventListener(type, func, useCap);
		});
		self.delegates = null;
		self.events = null;
	},
};
