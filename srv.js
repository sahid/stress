var program = require('commander');
var cluster = require('cluster');
var os = require('os');

var MB = 1024*1024;
var DEBUG = !true;

var DEFAULT_SERVICE = 8080;
var DEFAULT_CHUNK_MS = 10000;


var feed = function(socket, n, chunkms) {
    socket.emit("stream", {id: socket.id, chunk: n});
    setTimeout(function() {
	feed(socket, n+1, chunkms);
    }, chunkms);
};

var serv = function(service, chunkms, cpus) {
    var io = require('socket.io').listen(service, {
	"log": DEBUG, 
	"heatbeat":  false,});

    if (cpus > 1) {
	var RedisStore = require('socket.io/lib/stores/redis')
	, redis  = require('socket.io/node_modules/redis')
	, pub    = redis.createClient()
	, sub    = redis.createClient()
	, client = redis.createClient();
	
	io.set('store', new RedisStore({
	    redisPub : pub
	    , redisSub : sub
	    , redisClient : client
	}));
    }

    io.sockets.on('connection', function (socket) {
	feed(socket, 0, chunkms);
    });
    
    if (cluster.worker.id == 1) {
	setInterval(function() {
	    console.log("\033[2J");
	    console.log("clients: " + io.sockets.clients().length);
	    console.log("total mem(mb): " + os.totalmem()/MB);
	    console.log("free mem(mb): " + os.freemem()/MB);
	    console.log("cpus used: " + cpus);
	    console.log("load avg: " + os.loadavg()[0]);
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
	.option('-n, --num-cpus <n>', 
		'Set the number of cpu cores used. default:use system')
	.parse(process.argv);
    
    var chunkms = program.connections || DEFAULT_CHUNK_MS;
    var service = program.port || DEFAULT_SERVICE;
    var cpus = program.numCpus || os.cpus().length;
    
    if (cluster.isMaster) {
	for (var i = 0; i < cpus; i++) {
	    cluster.fork();
	}
    } else {
	serv(service, chunkms, cpus);
    }
})();