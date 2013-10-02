var program = require('commander');
var os = require('os');
var cluster = require('cluster');

var DEFAULT_HOST = "127.0.0.1";
var DEFAULT_SERVICE = 8080;
var DEFAULT_CHUNK_MS = 1000; //10s
var DEBUG = !true;
var MB = 1024*1024;

var dispatch = function(store, host, service, chunkms, cpus) {
    var io = require('socket.io').listen(service, {log: DEBUG}); //,
    io.configure(function() {
	io.set('store', store);
    });
    io.sockets.on('connection', function (socket) {
	//console.info("Stress's server welcomes to you. Your id: " + socket.id);
	socket.on("agent", function(data) {
	    socket.emit("response", {
		clients: io.sockets.clients().length,
		loadavg: os.loadavg(),
		totalmem: os.totalmem(),
		freemem: os.freemem(),
		cpus:os.cpus(),
		cpusused:cpus
	    });
	});
	
	// Event client, it registers a new client.
	socket.on("client", function(data) {
	    (feed = function(n) {
		socket.emit("stream", {id: socket.id, chunk: n});
		setTimeout(function() {
		    feed(n+1);
		}, chunkms);
	    })(0);
	});
    });

    if (cluster.worker.id == 1) {
	setInterval(function() {
	    console.log("\033[2J");
	    console.log("clients: " + io.sockets.clients().length);
	    console.log("total mem(mb): " + os.totalmem()/MB);
	    console.log("free mem(mb): " + os.freemem()/MB);
	    console.log("load avg: " + os.loadavg()[0])
	}, 1000);
    }
};


(function() {
    program
	.version('0.1')
	.option('-c, --chunk-ms <n>', 
		'The time between each reponse. default:1000', parseInt)
	.option('-p, --port <n>', 
		'The service this server handler. default:8080', parseInt)
	.option('-h, --host <n>', 
		'The service this server handler. default:127.0.0.1')
	.option('-n, --num-cpus <n>', 
		'Set the number of cpu cores used. default:use system')
	.parse(process.argv);
    
    var chunkms = program.connections || DEFAULT_CHUNK_MS;
    var service = program.port || DEFAULT_SERVICE;
    var host = program.host || DEFAULT_HOST;
    var cpus = program.numCpus || os.cpus().length;

    var store = new (require('socket.io-clusterhub'));    
    if (cluster.isMaster) {
	// Fork workers.
	for (var i = 0; i < cpus; i++) {
	    cluster.fork();
	}
	
	cluster.on('death', function(worker) {
	    console.log('worker ' + worker.pid + ' died');
	});
    } else {
	// workers
	dispatch(store, host, service, chunkms, cpus);
    }
})();