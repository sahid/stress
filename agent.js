var io = require('socket.io-client');
var exec = require('child_process').exec;

var MB = 1024*1024;
(function() {
    var socket = io.connect("http://127.0.0.1:8080/");
    socket.on("connect", function() {
	setInterval(function() {
	    socket.emit("agent");
	    socket.on("response", function(data) {
		console.log("\033[2J");
		console.log("connections: " + data.connections);
		console.log("total mem(mb): " + data.totalmem/MB);
		console.log("free mem(mb): " + data.freemem/MB);
		console.log("load avg: " +
			    data.loadavg[0]+ ", " +
			    data.loadavg[0]+ ", " +
			    data.loadavg[0]);
	    });
	}, 800);
    });
})();
