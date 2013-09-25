install:
	sudo add-apt-repository --yes ppa:chris-lea/node.js
	sudo apt-get update
	sudo apt-get install -y python-software-properties python g++ make
	sudo apt-get install -y nodejs 
	npm install socket.io
	npm install socket.io-client
	npm install socket.io-clusterhub
	npm install commander
	@echo
	@echo "Ready to stress your servers :-)"
	@echo "...Don't forget to tune ulimit."
