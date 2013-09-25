install:
	sudo apt-get install nodejs npm -y
	npm install socket.io
	npm install socket.io-client
	npm install commander
	@echo
	@echo "Ready to stress your servers :-)"
	@echo "...Don't forget to tune ulimit."
