var Dutie = require('./');
var Task = Dutie.Task;
var CallTask = Dutie.CallTask;

var Manager = new Dutie();

function addNumbers(a, b, callback) {
	setTimeout(function() { callback(a+b); }, 1000);
}

function squareNumber(a, callback) {
	setTimeout(function() { callback(a*a); }, 2000);
}

var task = new CallTask(addNumbers, [2, 4], { finish: function(cancel, num) { if (!cancel) console.log('task: ' + num); } });
var task_next = new CallTask(squareNumber, [5], { finish: function(cancel, num) { console.log('task_next: ' + num); }, priority: 1 });
Manager.add(task).add(task_next);

