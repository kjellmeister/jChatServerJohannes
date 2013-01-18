//Config:
var port = 1337;

//--------------------------------



function User(connection, name, age, sex, location, status)
{
	this.connection=connection;
	this.name=name || "Not set";
	this.age=age || "Not set";
	this.sex=sex || "Not set";
	this.location=location || "Not set";
	this.arr30Pos=-1;
	this.arr30Pos=-1;
	this.arr40Pos=-1;
	this.status= status || "online"
}

User.prototype = {
  getName:  function () { return this.name; },
  getAge: function () { return this.age; },      
  getSex:  function () { return this.sex; },
  getLocation:  function () { return this.location;},
  get20pos:  function () { return this.arr20Pos; },
  get30pos:  function () { return this.arr30Pos; },
  get40pos:  function () { return this.arr40Pos; },
  getStatus:  function () { return this.status; },
  
  setName:  function (name) { this.name=name; },
  setAge: function (age) { this.age=age; },      
  setSex:  function (sex) { this.sex=sex; },
  setLocation:  function (location) { this.location=location;},
  set20pos:  function (pos) {  this.arr20Pos=pos; },
  set30pos:  function (pos) {  this.arr30Pos=pos; },
  set40pos:  function (pos) {  this.arr40Pos=pos; },
  setStatus:  function (status) {  this.status=status; }
}
 

var users = [],
something20 = [],
something30 = [],
something40 = [];



// Require the modules we need
var WebSocketServer = require('websocket').server;
var http = require('http');



/**
 * Create a http server with a callback for each request
 *
 */
var httpServer = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(200, {'Content-type': 'text/plain'});
  response.end('Hello world\n');
}).listen(port, function() {
  console.log((new Date()) + ' HTTP server is listening on port ' + port);
});



/**
 * Create an object for the websocket
 * https://github.com/Worlize/WebSocket-Node/wiki/Documentation
 */
wsServer = new WebSocketServer({
  httpServer: httpServer,
  autoAcceptConnections: false
});



/**
 * Always check and explicitly allow the origin
 *
 */
function originIsAllowed(origin) {
  return true;
  if(origin === 'http://www.student.bth.se/~jokr11/DV1441/project/index.php?p=connected') {
    return true;    
  }
  return false;
}





/**
 * Avoid injections
 *
 */
function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


function updateOnlineList()
{
	var onlineUsers= "/addUsersToList";
  	  for(var i=0; i<users.length ; i++)
		{
			if(users[i])
			{	
				onlineUsers+=" ";
				onlineUsers+=users[i].getName()+"("+users[i].getStatus()+")-"+i;	
			}
		}
	//send name and id to clients
	  sendToAll(onlineUsers, "all", "");
}

function removeUserFromChats(twenty, thirty, fourty, id)
{
	if(twenty!=-1)
	{
		something20[users[id].get20pos()]=null;
		sendToAll("*"+users[id].getName()+" has left the room *" , "-1" , "20")
	}
	if(thirty!=-1)
	{
		something30[users[id].get30pos()]=null;
		sendToAll("*"+users[id].getName()+" has left the room *" , "-1" , "30")
	}
	if(fourty!=-1)
	{
		something40[users[id].get40pos()]=null;
		sendToAll("*"+users[id].getName()+" has left the room *" , "-1" , "40")
	}
}


/**
 * Accept connection under the johannes-protocol
 *
 */
function acceptConnectionAsJohannes(request, protocol)
{
	var connection = request.accept(protocol, request.origin);

	connection.broadcastId = users.push(new User(connection)) - 1;
	console.log((new Date()) + ' Broadcast connection accepted from ' + request.origin + ' id = ' + connection.broadcastId);
	//sendToAll();
	
	// Callback to handle each message from the client
	connection.on('message', function(message)
		{
			console.log(users[connection.broadcastId].getName());
			//sendToAll(message, connection.broadcastId);
			commands(message.utf8Data, connection.broadcastId);
		});
  
  // Callback when client closes the connection
  connection.on('close', function(reasonCode, description)
  	  {
  	  	  console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected broadcastid = ' + connection.broadcastId + '.');
  	  	  
  	  	  var twenty=users[connection.broadcastId].get20pos(), thirty=users[connection.broadcastId].get30pos(), fourty=users[connection.broadcastId].get40pos();
  	  	  
  	  	  removeUserFromChats(twenty, thirty, fourty, connection.broadcastId);
  	  	  
  	  	  users[connection.broadcastId] = null;
  	  	  updateOnlineList()
  	  });

  return true;
}

function commands(msg, id)
{
  var message = msg.split(" "),
  command = message[0],
  commandFound=false;
  
  
  if(command=="/adduser")
  {
  	  console.log("Command detected: "+command);
  	  users[users.length-1].setName(message[1]);
  	  users[users.length-1].setAge(message[2]);
  	  users[users.length-1].setSex(message[3]);
  	  users[users.length-1].setLocation(message[4]);
  	  console.log("updated new user: "+users[users.length-1].getName()+", "+users[users.length-1].getSex());
  	  
  	  updateOnlineList();
  	  
  	  commandFound=true;
  }
  
  else if(command=="/join")
  {
  	  console.log("Command detected: "+command);

  	  if(message[1])
  	  {
  	  	  var room = message[1];
  	  	  if(room=="20")
  	  	  {
  	  	  	  users[id].set20pos(something20.push(users[id])-1);
  	  	  }
  	  	  else if(room=="30")
  	  	  {
  	  	  	  users[id].set30pos(something30.push(users[id])-1);
  	  	  }
  	  	  else if(room=="40")
  	  	  {
  	  	  	  users[id].set40pos(something40.push(users[id])-1);
  	  	  }
  	  	  sendToAll("*"+users[id].getName()+" has joined the room * type /help for command list" , "-1" , room)
  	  }
  	  
  	  commandFound=true;
  }
  else if(command=="/dcFrom")
  {
  	  removeUserFromChats(command[1], command[2] ,command[3], id );
  }
  
  else if(command=="/say")
  {
  	  var command2 = message[2];
	  if(command2=="/me")
	  {
		  console.log("Command detected: "+command);
		  var i=3;
		  var output = "* "+users[id].getName()+" ";
		  for(i ; i<message.length ; i++)
		  {
			  output+=" "+message[i];
		  }
		  output+=" *";
		  sendToAll(output, id, message[1]);
		  return true;
	  }
	  else if(command2=="/nick")
	  {
		  console.log("Command detected: "+command);
		  if(message[3])
		  {
		  	  var nick="";
		  	  for(var i=0 ; i<message[3].length && i<10 ; i++)
		  	  	  nick+=message[3][i];
			  var output = "* "+users[id].getName()+" is now known as "+nick+"*";
			  users[id].setName(message[3]);
			  
			  sendToAll(output, id, message[1]);
			  updateOnlineList();
			  
			  users[id].connection.sendUTF("/nick "+nick);
			  
			  
		  }
		  return true;
	  }
	  else if(command2=="/help")
	  {
	  	  console.log("Commassssnd detected: "+command2);
	  	  users[id].connection.sendUTF("/"+message[1]+" Commands:");
	  	  users[id].connection.sendUTF("/"+message[1]+" /me doesSomething");
	  	  users[id].connection.sendUTF("/"+message[1]+" /info nick");
	  	  users[id].connection.sendUTF("/"+message[1]+" /nick newname");
	  	  users[id].connection.sendUTF("/"+message[1]+" /status yourOnlineStatus")
	  	  users[id].connection.sendUTF("/"+message[1]+" -----------------------");
	  	  
	  	  return true;
	  }
	  else if(command2=="/info")
	  {
		  console.log("Commassssnd detected: "+command2);
		  if(message[3])
		  {
		  	  for(var i=0 ; i<users.length && i<10 ; i++)
		  	  {
		  	  	  if(users[i])
		  	  	  {
		  	  	  	  console.log("jämför: "+users[i].getName()+" med "+message[3]);
		  	  	  	  if(users[i].getName()==message[3])
		  	  	  	  {
		  	  	  	  	  console.log("hittad");
		  	  	  	  	  users[id].connection.sendUTF("/"+message[1] + " Name: "+users[i].getName()+". Age: "+users[i].getAge()+". Sex: "+users[i].getSex()+". Location: "+users[i].getLocation());
		  	  	  	  }
		  	  	  }
		  	  }
		  }
		  return true;
	  }
	  else if(command2=="/status")
	  {
		  console.log("Command detected: "+command);
		  if(message[3])
		  {
		  	  var status="";
		  	  for(var i=0 ; i<message[3].length && i<7 ; i++)
		  	  	  status+=message[3][i];
		  	  
		  	  
			  var output = "* "+users[id].getName()+" set status to "+status+"*";
			  users[id].setStatus(message[3]);
			  
			  sendToAll(output, id, message[1]);
			  updateOnlineList();
			  
			  //users[id].connection.sendUTF("/nick "+message[3]);
			  
			  
		  }
		  return true;
	  }
	  else
	  {
	  	  now = new Date();
		  var i=2;
		  var output = users[id].getName()+" "+now.toLocaleTimeString()+":";
		  for(i ; i<message.length ; i++)
		  {
			  output+=" "+message[i];
		  }
		  sendToAll(output, id, message[1]);
		  return true;
	  }
	  commandFound=true;
	  
	  
  }
  
  return commandFound;
}

function sendToAll(message, id, arr)
{
	
	var clients = 0,
	priv=arr.split("-");
	//command = commands(htmlEntities(message.utf8Data), id);

	if(priv[0]!="priv")
	{
		if(arr=="20")
		{
			message = "/20 "+message;
			console.log("message to send to 20: "+message);
			for(var i=0; i<something20.length ; i++)
			{
				if(something20[i])
				{
					clients++;
					something20[i].connection.sendUTF(htmlEntities(message));
				}
			}
		}
		else if(arr=="30")
		{
			message = "/30 "+message;
			for(var i=0; i<something30.length ; i++)
			{
				if(something30[i])
				{
					clients++;
					something30[i].connection.sendUTF(htmlEntities(message));
				}
			}
		}
		else if(arr=="40")
		{
			message = "/40 "+message;
			for(var i=0; i<something40.length ; i++)
			{
				if(something40[i])
				{
					clients++;
					something40[i].connection.sendUTF(htmlEntities(message));
				}
			}
		}
		else
		{
			for(var i=0; i<users.length ; i++)
			{
				if(users[i])
				{
					clients++;
					users[i].connection.sendUTF(htmlEntities(message));
				}
			}
		}
		console.log('Broadcasted message to ' + clients + ' clients: ' + message);
	}
	else
	{
		
		
		console.log("Pm to "+priv[1]+"( from "+users[id].getName()+")"+message);
		if(users[priv[1]])
		{
			
			var messageToR = "/pm "+id+" "+users[id].getName()+"("+users[id].getStatus()+") "+message;
			messageToS = "/pm "+priv[1]+" "+users[id].getName()+" "+message;
			
			users[priv[1]].connection.sendUTF(htmlEntities(messageToR));
			users[id].connection.sendUTF(htmlEntities(messageToS));
		}
		else
		{
			users[id].connection.sendUTF("/pm "+priv[1]+" "+users[id].getName()+" "+"*User has logged out*");
		}
	}
}



/**
 * Create a callback to handle each connection request
 *
 */
wsServer.on('request', function(request) {
  var status = null;

  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }


   status = acceptConnectionAsJohannes(request, request.requestedProtocols[0]);


  // Unsupported protocol.
  if(!status) {
    //acceptConnectionAsEcho(request, null);
    console.log('Subprotocol not supported');
    //request.reject(404, 'Subprotocol not supported');
  }

}); 
