var program = require('commander');
var io = require('socket.io-client');

var DEFAULT_MAX_CONNECTIONS = 100;
var DEFAULT_BUCKET_SIZE = 10;
var DEFAULT_BUCKET_MS = 100;

var flood = function() {
    var socket = io.connect("http://127.0.0.1:8080/", {'force new connection': true});
    socket.on("connect", function() {
	socket.emit("client");
	socket.on("stream", function(data) {
	    //console.log(data);
	}); 
   });
};

var loop = function(conn, bsize, bms) {
    var pool = 0;
    var idint = setInterval(function() {
	console.log("pool: " + pool);
	for (var i=0; i<bsize; i++) {
	    if (pool >= conn) {    
		clearInterval(idint);
	    } else {
		flood();
		pool += 1;
	    }
	}
    }, bms);
};

(function() {
    program
	.version('0.1')
	.option('-c, --connections <n>', 
		'Number of connections', parseInt)
	.option('-b, --bucket-size <n>', 
		'Number of connection launched every "bucket-ms"', parseInt)
	.option('-m, --bucket-ms <n>', 
		'Time to wait before to launch a bicket of connections', parseInt)
	.parse(process.argv);
    
    var conn = program.connections || DEFAULT_MAX_CONNECTIONS;
    var bsize = program.bucketSize || DEFAULT_BUCKET_SIZE;
    var bms = program.bucketMs || DEFAULT_BUCKET_MS;

    loop(conn, bsize, bms);
})();