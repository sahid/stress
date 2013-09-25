var program = require('commander');
var io = require('socket.io-client');

var DEFAULT_MAX_CONNECTIONS = 100;
var DEFAULT_BUCKET_SIZE = 10;
var DEFAULT_BUCKET_MS = 100;
var DEFAULT_HOST = "127.0.0.1";
var DEFAULT_SERVICE = 8080
var DEFAULT_CLOSE_TIMEOUT = 60
var DEFAULT_RETRY_FAILED = false;

var gl_spawned = 0;
var gl_accepted = 0;
var gl_refused = 0;

var flood = function(host, service, retryfailed) {
    var socket = io.connect("http://"+host+":"+service+"/", 
			    {'force new connection': true,
			     'close timeout': DEFAULT_CLOSE_TIMEOUT});
    socket.on("connect", function() {
	gl_accepted += 1
	socket.emit("client");
	socket.on("stream", function(data) {
	    //console.log(data);
	});  
   });

    socket.on('connect_failed', function(){
	gl_refused += 1;

	if (retryfailed)
	    gl_spawned += 1;
    });
};

var loop = function(conn, bsize, bms, host, service, retryfailed) {
    var idint = setInterval(function() {
	process.stdout.write("Connections spawned: " + gl_spawned + 
			     ", Connection accepted: "+ gl_accepted +
			     ", Connextion refused: " + gl_refused + ".\r");
	for (var i=0; i<bsize; i++) {
	    if (gl_spawned >= conn) {    
		//clearInterval(idint);
	    } else {
		flood(host, service, retryfailed);
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
	.option('-r, --retry-failed', 
		'Retry connection failed because of pool timeout.')
	.option('-b, --bucket-size <n>', 
		'Number of connection launched every "bucket-ms"', parseInt)
	.option('-m, --bucket-ms <n>', 
		'Time to wait before to launch a bicket of connections', parseInt)
	.option('-p, --port <n>', 
		'The service this server handler. default:8080', parseInt)
	.option('-h, --host <n>', 
		'The service this server handler. default:127.0.0.1')
	.parse(process.argv);
    
    var conn = program.connections || DEFAULT_MAX_CONNECTIONS;
    var bsize = program.bucketSize || DEFAULT_BUCKET_SIZE;
    var bms = program.bucketMs || DEFAULT_BUCKET_MS;
    var retryfailed = program.retryFailed || DEFAULT_RETRY_FAILED;
    var service = program.service || DEFAULT_SERVICE;
    var host = program.host || DEFAULT_HOST;

    loop(conn, bsize, bms, host, service, retryfailed);
})();