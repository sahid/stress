var program = require('commander');
var io = require('socket.io-client')
var cluster = require('cluster');

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

var flood = function(host, service, retryfailed) {
    var socket = io.connect("http://"+host+":"+service+"/", 
			    {'force new connection': true,
                             'close timeout': DEFAULT_CLOSE_TIMEOUT,
                             'reconnection delay': 500,
                             'reconnection limit': 32000,
                             'max reconnection attempts': 10});
    socket.on("connect", function() {
	gl_accepted += 1
	socket.emit("client");
	socket.on("stream", function(data) {
	    //console.log(data);
	});  
   });

    socket.on('connect_failed', function(){
	gl_failed += 1;
    });

    socket.on('disconnect', function() {
	gl_failed += 1;
    });
};

var loop = function(conn, bsize, bms, host, service, retryfailed) {
    var idint = setInterval(function() {
	for (var i=0; i<bsize; i++) {
	    if (gl_spawned >= conn) {    
		//clearInterval(idint);
	    } else {
		flood(host, service, retryfailed);
		gl_spawned += 1;
	    }
	    process.send({"spawned": gl_spawned});
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
    var retryfailed = program.retryFailed || DEFAULT_RETRY_FAILED;
    var service = program.service || DEFAULT_SERVICE;
    var host = program.host || DEFAULT_HOST;
    var nproc = program.numProc || DEFAULT_NUMPROCESS;

    var conn_per_clt = conn / nproc;

    if (cluster.isMaster) {
	// Fork workers.
	for (var i = 0; i < nproc; i++) {
	    cluster.fork();
	}

	setInterval(function() {
	    console.log("\033[2J");
	    function eachWorker(callback) {
		for (var id in cluster.workers) {
		    callback(cluster.workers[id]);
		}
	    }
	    eachWorker(function(worker) {
		worker.send({"id": worker.id});
	    });
	}, 1000);

	cluster.on("message", function(msg) {
	    console.log(msg);
	})
	
	cluster.on('death', function(worker) {
	    console.log('worker ' + worker.pid + ' died');
	});
    } else {
	process.on("message", function(msg) {
	    console.log("Worker:" + msg.id + " Connections spawned: " + gl_spawned + 
			", Connections accepted: "+ gl_accepted +
			", Connections failed: " + gl_failed + ".\r");
	    
	});
	// workers
	loop(conn_per_clt, bsize, bms, host, service, retryfailed);
    }
})();