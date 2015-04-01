



function Dutie() {
	
	this.tasks = Array();
	this.currentTask = null;
	
	this.init = function() {
		this.update();
	}
	
	this.update = function() {
		if (!this.currentTask && this.tasks.length == 0) return;
		if (this.currentTask && this.currentTask.update) {
			var val = this.currentTask.update.apply(this, this.currentTask.updateParams);
			if (val) this.finish();
		} else this.checkAll();
	}
	
	this.add = function(Task) {
		this.tasks.push(Task);
		this.checkAll();
		return this;
	}
	
	this.sortTasks = function() {
		this.tasks.sort(function(a, b) {
			if (a.priority > b.priority) return -1;
			if (a.priority < b.priority) return 1;
			return 0;
		});
	}
	
	this.nextTask = function() {
		this.currentTask = null;
		if (this.tasks.length == 0) return;
		this.sortTasks();
		for (var i = 0; i < this.tasks.length; i++) {
			var t = this.tasks[i];
			if ((!t.check || t.check.apply(this, t.checkParams)) && t.depend.length == 0) {
				this.currentTask = this.tasks.splice(i, 1)[0]; // 2 in 1! Remove and add!
				this.currentTask.parent = this;
				if (this.currentTask.start) this.currentTask.start.apply(this.currentTask, this.currentTask.startParams);
				this.update();
				break;
			}
		}
		this.checkAll();
	}
	
	this.finish = function() {
		var param = [false].concat(this.currentTask.finishParams);
		if (this.currentTask.finish) this.currentTask.finish.apply(this, param);
		if (!this.currentTask) return;
		this.currentTask.completed = true;
		this.nextTask();
	}
	
	this.cancel = function() {
		var param = [true].concat(this.currentTask.finishParams);
		if (this.currentTask.finish) this.currentTask.finish.apply(this, param);
		if (!this.currentTask) return;
		this.tasks.push(this.currentTask);
		this.currentTask = null;
	}
	
	this.endTask = function() {
		this.currentTask.completed = true;
		this.currentTask = null;
		// You murderer.
	}
	
	this.checkAll = function() {
		this.sortTasks();
		for (var i = 0; i < this.tasks.length; i++) {
			var t = this.tasks[i];
			t.checkDepend();
			if ((!t.check || t.check.apply(this, t.checkParams)) && t.depend.length == 0) {
				if (!this.currentTask) {
					this.currentTask = this.tasks.splice(i, 1)[0];
					this.currentTask.parent = this;
					if (this.currentTask.start) this.currentTask.start.apply(this.currentTask, this.currentTask.startParams);
					this.update();
					break;
				} else if (t.priority > this.currentTask.actPriority) {
					this.cancel();
					this.currentTask = this.tasks.splice(i, 1)[0];
					this.currentTask.parent = this;
					if (this.currentTask.start) this.currentTask.start.apply(this.currentTask, this.currentTask.startParams);
					this.update();
					break;
				}
			}
		}
	}
}

Dutie.Task = function(update, updateParam, options, cb) {
	this.depend = Array();
	this.completed = false;
	this.cb = cb || false;
	this.parent = null;
	
	this.dependOn = function(tsk) {
		this.depend.push(tsk);
		return this;
	}
	
	this.priority = 0;
	this.actPriority = 0;
	
	this.start;
	this.startParams;
	this.update;
	this.updateParams;
	this.finish;
	this.finishParams;
	this.check;
	this.checkParams;
	
	this.init = function(up, upParam, opt) {
		if (!up) throw Error('You need an update function to create a task');
		
		this.update = up;
		this.updateParams = upParam || Array();
		
		this.start = opt.start || null;
		this.startParams = opt.startParams || Array();
		this.finish = opt.finish || null;
		this.finishParams = opt.finishParams || Array();
		this.check = opt.check || null;
		this.checkParams = opt.checkParams || Array();
		
		this.priority = opt.priority || 0;
		this.actPriority = opt.actPriority || this.priority;
	}
	this.init(update, updateParam, options);
	
	this.checkDepend = function() {
		for (var i = 0; i < this.depend.length; i++) {
			if (this.depend[i].completed) {
				this.depend.splice(i, 1);
				return this.checkDepend();
			}
		}
	}
}

Dutie.CallTask = function(start, startParam, options, cb) {
	this.depend = Array();
	this.completed = false;
	this.cb = cb || false;
	this.parent = null;
	
	var self = this;
	
	this.dependOn = function(tsk) {
		this.depend.push(tsk);
		return this;
	}
	
	this.priority = 0;
	this.actPriority = 0;
	
	this.start = function(ar) {
		this.eraseCallback();
		this.startFunc.apply(this.startFunc, this.startParams.concat(this.currentCallback));
	}
	
	this.eraseCallback = function() {
		//this.currentCallback.functionBody = '';
	}
	
	this.finish = function(cancel) {
		var self = this.currentTask;
		if (self.finishFunc) self.finishFunc.apply(self.finishFunc, [cancel].concat(self.finishParams));
		self.finishParams = false;
	}
	
	this.callback = function() {
		//this.finishFunc.apply(this.finishFunc, [false].concat(arguments));
		//self.finishParams = Object.keys(arguments).map(function(value, index) {return arguments[index]});
		console.log(arguments);
		self.finishParams = Array.prototype.slice.call(arguments);
		self.parent.finish();
	}
	
	this.startFunc;
	this.startParams;
	this.update;
	this.updateParams;
	this.finishFunc;
	this.finishParams; // Set by callback
	this.check;
	this.checkParams;
	
	this.currentCallback;
	
	this.init = function(st, stParam, opt) {
		if (!st) throw Error('You need an update function to create a task');
		
		this.startFunc = st;
		this.startParams = startParam || Array();
		
		this.update = opt.update || null;
		this.updateParams = opt.updateParams || Array();
		this.finishFunc = opt.finish || null;
		this.check = opt.check || null;
		this.checkParams = opt.checkParams || Array();
		
		this.priority = opt.priority || 0;
		this.actPriority = opt.actPriority || this.priority;
		
		this.currentCallback = this.callback;
	}
	this.init(start, startParam, options);
	
	this.checkDepend = function() {
		for (var i = 0; i < this.depend.length; i++) {
			if (this.depend[i].completed) {
				this.depend.splice(i, 1);
				return this.checkDepend();
			}
		}
	}
}

module.exports = Dutie;