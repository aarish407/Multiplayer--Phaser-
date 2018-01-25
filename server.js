var express = require('express');
var app = express(app);
var server = require('http').createServer(app);
 
 app.use(express.static(__dirname)); // serve static files from the current directory
 
var Eureca = require('eureca.io'); //get EurecaServer class
var eurecaServer = new Eureca.Server({allow:['setId', 'spawnEnemy', 'kill', 'updateState']}); //create an instance of EurecaServer
 
eurecaServer.attach(server); //attach eureca.io to our http server 

// var eurecaServer = new EurecaServer();
// var eurecaServer = new Eureca.Server({allow:['setId']});
var clients= {};

//detect client connection
eurecaServer.onConnect(function (conn) {    
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);

    //the getClient method provide a proxy allowing us to call remote client functions
    var remote = eurecaServer.getClient(conn.id);    
	
	//register the client
	clients[conn.id] = {id:conn.id, remote:remote}
	
	//here we call setId (defined in the client side)
	remote.setId(conn.id);
});
 
//detect client disconnection
eurecaServer.onDisconnect(function (conn) {    
    console.log('Client disconnected ', conn.id);	

    var removeId = clients[conn.id].id;
	
	delete clients[conn.id];
	
	for (var c in clients)
	{
		var remote = clients[c].remote;
		
		//here we call kill() method defined in the client side
		remote.kill(conn.id);
	}	
});


eurecaServer.exports.handleKeys = function (keys) {
	var conn = this.connection;
	var updatedClient = clients[conn.id];
	
	for (var c in clients)
	{
		var remote = clients[c].remote;
		remote.updateState(updatedClient.id, keys);
		
		//keep last known state so we can send it to new connected clients
		clients[c].laststate = keys;
	}
}


eurecaServer.exports.handshake = function()
{
    //var conn = this.connection;
	console.log("In handshake");

    for (var c in clients)
    {
        var remote = clients[c].remote;
        for (var cc in clients)
        {       
        	//send latest known position
			var x = clients[cc].laststate ? clients[cc].laststate.x:  0;
			var y = clients[cc].laststate ? clients[cc].laststate.y:  0;
        	
            remote.spawnEnemy(clients[cc].id, 0, 0);        
        }
    }
}

server.listen(8000);

console.log("Listening on 8000");



