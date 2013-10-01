var program = require('commander');

var DEFAULT_HOST = "127.0.0.1";
var DEFAULT_SERVICE = 8080;
var DEFAULT_REFRESH = 3000;

var io = require('socket.io-client');
var exec = require('child_process').exec;

var MB = 1024*1024;
var print = function(host, service, refresh) {
    var socket = io.connect("http://"+host+":"+service+"/");
    socket.on("connect", function() {
	setInterval(function() {
	    socket.emit("agent");
	    socket.on("response", function(data) {
		console.log("\033[2J");
		//console.log("connections: " + data.connections);
		console.log("open: " + data.open);
		//console.log("closed: " + data.closed);
		console.log("total mem(mb): " + data.totalmem/MB);
		console.log("free mem(mb): " + data.freemem/MB);
		console.log("load avg: " +
			    data.loadavg[0]+ ", " +
			    data.loadavg[0]+ ", " +
			    data.loadavg[0]);
		console.log("cpu used: " + data.cpusused)
		console.log(data.cpus);
	    });
	}, refresh);
    });
};


(function() {
    program
	.version('0.1')
	.option('-r, --refresh <n>', 
		'Refresh the data', parseInt)
	.option('-p, --port <n>', 
		'The service this server handler. default:8080', parseInt)
	.option('-h, --host <n>', 
		'The service this server handler. default:127.0.0.1')
	.parse(process.argv);
    
    var nrefresh = program.refresh || DEFAULT_REFRESH;
    var service = program.service || DEFAULT_SERVICE;
    var host = program.host || DEFAULT_HOST;
    
    print(host, service, nrefresh)
})();