#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var http = require('http');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var BCcon = null;
var clients = [];

function httpGet(url)	{
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET",url,false);
	xmlHttp.send();
	return xmlHttp.responseText;
}

function sendAll(message)	{
	for (i = 0; i < clients.length; i++)	{
		clients[i].send(message);
	}
}

function addClient(client)	{
	clients.push(client);	
	BCcon.send('{"op":"ping_tx"}');
}

function remClient(client)	{
	var i = clients.indexOf(client);
	if (i != -1)	{
		clients.splice(i,1)[0].close(0,"server dropped you");
		console.log("client " + i + " has disconnected.");
	}
}

var txs, index = 0;

BCSocket = new WebSocketClient({});

BCSocket.on('connect',function(webSocketConnection)	{
	console.log((new Date()) + 'Server is connected to Blockchain.info');
	BCcon = webSocketConnection;
	BCcon.on('message',function(message)	{
		var info = JSON.parse(message.utf8Data);
		console.log(info.op + ' received');
		if (info.op == "block")	{
			index = 0;
			txs = info.x.txIndexes;
			for (i = 0; i < txs.length; i++)	{
				console.log(i + "/" + info.x.nTx);
				var txt = httpGet("https://blockchain.info/tx-index/"+txs[i]+"?format=json&cors=true");
				console.log(txt);
				txs[i] = JSON.parse(txt);
				var time = Date.now() + 50;
				while (Date.now() < time)
					var a = true;
			}
			console.log('done processing');
			info.x.txIndexes = undefined;
			info.x.txs = txs;
			sendAll(JSON.stringify(info));
		}
		else if (info.op == "utx")	{
			var hash = info.x.hash;
			var cpinfo = JSON.parse(httpGet("https://counterpartychain.io/api/transaction/" + hash));
			if (cpinfo.success == 1)	{
				info.x.counterparty = true;
				info.x.cp_asset_type = cpinfo.asset;
				info.x.cp_asset_count = cpinfo.quantity;
				info.x.cp_tx_type = cpinfo.type;
				info.x.source = cpinfo.source;
				info.x.destination = cpinfo.destination;
			}
			else	{
				info.x.counterparty = false;
			}
			var ccinfo = JSON.parse(httpGet("https://api.coinprism.com/v1/transactions/" + hash));
			clients[0].send("https://api.coinprism.com/v1/transactions/" + hash);
			console.log(ccinfo);
			if (ccinfo.Message != 'Error')	{
				for (i = 0; i < (ccinfo.inputs).length; i++)	{
					if (ccinfo.inputs[i].asset_id == null)
						continue;
					for (j = 0; j < (info.x.inputs).length; j++)	{
						if (info.x.inputs[j].addr == ccinfo.inputs[i].addresses[0])	{
							info.x.inputs[j].asset_id = ccinfo.inputs[i].asset_id;
							info.x.inputs[j].asset_quantity = ccinfo.inputs[i].asset_quantity;
							break;
						}
					}
				}
				for (i = 0; i < (ccarray).length; i++)	{
					if (ccinfo.outputs[i].asset_id == null)
						continue;
					for (j = 0; j < (info.x.outputs).length; j++)	{
						if (info.x.outputs[j].addr == ccinfo.outputs[i].addresses[0])	{
							info.x.outputs[j].asset_id = ccinfo.outputs[i].asset_id;
							info.x.outputs[j].asset_quantity = ccinfo.outputs[i].asset_quantity;
							break;
						}
					}
				}
			}
			sendAll(JSON.stringify(info));
		}
	});
	BCcon.on('frame',function(webSocketFrame)	{
		console.log('frame received');
	});
	BCcon.on('close',function(reasonCode,description)	{
		console.log('Disconnected from BC.I');
	});
	BCcon.on('error',function(error)	{
		console.log('socket error');
		console.log(error);
	});
	console.log('sending ping_block');
	//BCcon.sendUTF('{"op":"ping_block"}');
});

BCSocket.on('connectFailed',function(errorDescription)	{
	console.log((new Date()) + 'Server did not connect to Blockchain.info' + errorDescription);
})

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        remClient(connection);
    });
	addClient(connection);
});

BCSocket.connect("wss://blockchain.info/inv");
