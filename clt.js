var program = require('commander');
var io = require('socket.io-client')

var DEFAULT_MAX_CONNECTIONS = 100;
var DEFAULT_BUCKET_SIZE = 10;
var DEFAULT_BUCKET_MS = 100;
var DEFAULT_HOST = "127.0.0.1";
var DEFAULT_SERVICE = 8080
var DEFAULT_CLOSE_TIMEOUT = 10000
var DEFAULT_RETRY_FAILED = false;
var DEFAULT_NUMPROCESS = 1;

var gl_spawned = 0;
var gl_accepted = 0;
var gl_failed = 0;
var msg_received = 0;

var flood = function(host, service) {
    var socket = io.connect("http://"+host+":"+service+"/", 
			    {'force new connection': true,});
    socket.on("connect", function() {
	gl_accepted += 1
	socket.on("stream", function(data) {
	    // TODO(sahid): Needs to implement.
	});  
    });
    
    socket.on('connect_failed', function(){
	gl_failed += 1;
    });
    
    socket.on('disconnect', function() {
	gl_failed += 1;
    });  
};

var loop = function(conn, bsize, bms, host, service) {
    var idint = setInterval(function() {
	for (var i=0; i<bsize; i++) {
	    if (gl_spawned >= conn) {    
	    } else {
		flood(host, service);
		gl_spawned += 1;
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
		'Time to wait before to launch a bucket of connections', parseInt)
	.option('-p, --port <n>', 
		'The service this server handler. default:8080', parseInt)
	.option('-h, --host <n>', 
		'The service this server handler. default:127.0.0.1')
	.option('-n, --num-proc <n>', 
		'Set the number of process used. default:1', parseInt)
	.parse(process.argv);
    
    var conn = program.connections || DEFAULT_MAX_CONNECTIONS;
    var bsize = program.bucketSize || DEFAULT_BUCKET_SIZE;
    var bms = program.bucketMs || DEFAULT_BUCKET_MS;
    var service = program.port || DEFAULT_SERVICE;
    var host = program.host || DEFAULT_HOST;
    
    setInterval(function() {
	console.log("Connections spawned: " + gl_spawned + 
		    ", Connections accepted: "+ gl_accepted +
		    ", Connections failed: " + gl_failed + ".\r");
    }, 1000);

    loop(conn, bsize, bms, host, service);
})();