if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}

var maxage = 8 * 60 * 1000,
    paused = false,
    garbageidle = 0;

// viva graph part 
var graphics = Viva.Graph.View.webglGraphics();

var isWebgl = graphics.isSupported();
if (!isWebgl) {
    alert("Turn on webgl or use modern browser");
}

var graph = Viva.Graph.graph(),
layout = Viva.Graph.Layout.forceDirected(graph, {
   springLength : 80,
   springCoeff : 0.0002,
   dragCoeff : 0.009,
   gravity : -15,
   theta : 0.7
}), 
minNodeSize = 1,
maxNodeSize = 100000000;
function log10(val) {
    return Math.log(val) / Math.LN10;
}
function log2(val) {
    return Math.log(val) / Math.LN2;
}
var scaleType = "LOG"; // LINEAR
var getNodeColor = function(node) {
    // here different colors for tx, input, output, mixed and txconfirmed
    if(node.data && node.data.t && node.data.t == "i"){ 
        return 0x00FF00;
    }else if(node.data && node.data.t && node.data.t == "o"){
        return 0xFF0000;
    }else if(node.data && node.data.t && node.data.t == "m"){
        return 0xFFA500;
    }
    return 0x008ED2;
},

getNodeSize = function(node){
    if(! node.data || !node.data.s){
        return 50;
    }
    var rmin = 32;
    var rmax = 96;
    
    // linear normalization to a range rmin,rmax
    if(scaleType == "LINEAR"){
        return rmin + (rmax - rmin) * ( (node.data.s - minNodeSize)/(maxNodeSize - minNodeSize) ) ;
    }else{    
        // log normalization to a range rmin,rmax
        var min = log2(minNodeSize);
        var max = log2(maxNodeSize);
        var val = log2( node.data.s );
        // linear scaling from min.max -> rmin rmax
        return rmin + (rmax - rmin) * ( (val - min)/(max - min) ) ;
    }
},
getNodeDetails = function(node){
    // 
    // http://blockchain.info/rawtx/$tx_index?format=json
    var label = "transaction";
    var id = node.id;
    if(node.data && node.data.t){
        if(node.data.t == "i"){
            // input node
            label = "input";
        }
        else if(node.data.t == "o"){
            // output node
            label = "output";
        }
        else if(node.data.t == "mix"){
            // node which is both input and output
            label = "input/output";
        }
        
        // for addresses infor cors not enabled :-( 
        // enabled for blocks
        
        var balance = 0;
        //lets get balance
        document.getElementById("info").innerHTML = label+"<br/>"+id+"<br/>balance: Loading...<br/>remaining time:"+(node.data.a-Date.now()+maxage+node.links.length*25)/1000+"s";
        $.ajax({
            //url:"http://blockchain.info/address/"+id+"?format=json&limit=1&cors=true",
            //url:"http://blockchain.info/rawblock/123?cors=true&format=json",
            url:"https://blockchain.info/q/addressbalance/"+id+"?cors=true",
            async:true,
            crossDomain:true,
            dataType:"text",
            success:function(text){
                balance = text/100000000;
                document.getElementById("info").innerHTML = label+"<br/>"+id+"<br/>balance: "+balance +" BTC<br/>remaining time:"+(node.data.a-Date.now()+maxage+node.links.length*25)/1000+"s";
            },
            error:function(){
                document.getElementById("info").innerHTML = label+"<br/>"+id+"<br/>balance: throttled by Blockchain.info<br/>remaining time:"+(node.data.a-Date.now()+maxage+node.links.length*25)/1000+"s";
            }
        });
        
        //document.getElementById("info").innerHTML = label+"<br/>"+id+"<br/>balance: "+balance +" BTC<br/>remaining time:"+(node.data.a-Date.now()+maxage)/1000+"s";
    }
    else   {
        // transaction node
        document.getElementById("info").innerHTML = label+"<br/>"+id+"<br/>remaining time:"+(node.data.a-Date.now()+maxage+node.links.length*25)/1000+"s";
    }
};
// need to get these 2 from yavis.reddit.min.js
graphics.setLinkProgram(Viva.Graph.View.webglDualColorLinkProgram());
graphics.setNodeProgram(Viva.Graph.View.webglCustomNodeProgram());
graphics
.node(function(node){
    var img = Viva.Graph.View.webglSquare(getNodeSize(node), getNodeColor(node));
    return img;
 })
.link(function(link){
     var fromColor, toColor;
     fromColor = toColor = 0x808080;
     var line = Viva.Graph.View.webglDualColorLine(fromColor, toColor);
     line.oldStart = fromColor;
     line.oldEnd = toColor;
     return line;
});
var renderer = Viva.Graph.View.renderer(graph,{
   layout     : layout,
   graphics   : graphics,
   container  : document.getElementById('g')
   //prerender  : 10
});
var events = Viva.Graph.webglInputEvents(graphics, graph),
lastHovered = null,
colorLinks = function(node, color) {
    if (node && node.id) {
        graph.forEachLinkedNode(node.id, function(node, link){
            var linkui = graphics.getLinkUI(link.id);
            try {
                if (color) { 
                    linkui.start = linkui.end = color;
                } else {
                    //link.ui.start = link.ui.oldStart; 
                    //link.ui.end =link.ui.oldEnd;
                    linkui.start = linkui.end = 0x80808040;
                } 
            } catch (e) {}
        });
    }
};
             
events.mouseEnter(function(node){
    
    getNodeDetails(node);
    colorLinks(lastHovered); 
    lastHovered = node;
 
    graph.forEachLinkedNode(node.id, function(node, link){
        var linkui = graphics.getLinkUI(link.id);
        try {
            linkui.start = linkui.end = 0xffffffff;
            graphics.bringLinkToFront(linkui);
        } catch(e){}
    });
 
 renderer.rerender();
}).mouseLeave(function(node) {
 
 colorLinks(lastHovered);
 lastHovered = null;
 
 colorLinks(node);
 renderer.rerender();
});
// pause rendere on spacebar
$(window).keydown(function(e) {
    if (e.keyCode === 32) { // toggle on spacebar; 
        e.preventDefault();
        paused = !paused;
        if (paused) { renderer.pause(); } 
        else { renderer.resume(); } 
    }
});
var width = $("#g").width(),
    height= $("#g").height();
renderer.run();
graphics.scale(0.15, {x : width/2, y : height/2});
// websockets part
var linksBuffer = [];
var wsUri = "wss://ws.blockchain.info/inv"; 
var output;  
 
function init() { 
output = document.getElementById("output"); 
testWebSocket();
}  
var colorNodes = function(node, color) {
    if (node && node.id) {
         graph.forEachNode(function(node){  
            if (color) { 
                var ui = graphics.getNodeUI(node.id);
                try {
                    ui.color = color;
                } catch(e){}
            }
        });
    }
};
function addNodes(link){

    if(link.t == "i"){
        var node = graph.getNode(link.from); 
        if( !node && link.from != 'undefined'){
            graph.addNode(link.from,{s:link.value,t:link.t,a:Date.now()});
            node = graph.getNode(link.from)
        } 
        else if (link.from != 'undefined') {
            // such a node already exists
            if(node.data && node.data.t && node.data.t == "o" ) {
                node.data.a = Date.now();
                node.data.t = "mix";
                var ui = graphics.getNodeUI(node.id);
                try {
                    ui.color = 16776960;
                } catch(e){}
                renderer.rerender();
            }
        }
    } 
    else if(link.t == "o"){
        var node = graph.getNode(link.to); 
        if (! node && link.to != 'undefined')    {
            graph.addNode(link.to,{s:link.value,t:link.t,a:Date.now()});
            node = graph.getNode(link.from)
        } 
        else if (link.to != 'undefined') {
            // such a node alredy exists.  
            if(node.data && node.data.t && node.data.t == "i"){
                node.data.a = Date.now();
                node.data.t = "mix";
                var ui = graphics.getNodeUI(node.id);
                try {
                    ui.color = 16776960;
                } catch(e){}
                renderer.rerender();
            }
        }
    }
}
function testWebSocket() { 
    websocket = new WebSocket(wsUri); 
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) }; 
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) }; 
}  
function onOpen(evt) { 
    writeToScreen("CONNECTED"); 
    doSend({"op":"unconfirmed_sub"}); 
    doSend({"op":"blocks_sub"});
    doSend({"op":"ping_block"});
}

function onClose(evt) { writeToScreen("DISCONNECTED"); }  

function onMessage(evt) { 
    // parse message
    var msg = JSON.parse(evt.data);
    var txHash = msg.x.hash;
    var links = [];
    if(msg.op == "utx") {
        // uncorfimed transactions
        var inputs = msg.x.inputs;
        var outputs = msg.x.out;
        // generate from to 
        var links = [];
        for(var i=0;i<inputs.length;i++){
            var input = inputs[i];
            links.push({
                from: input.prev_out.addr,
                to: txHash,
                value: input.prev_out.value,
                t:"i"
            });
        }
        for(var j=0;j<outputs.length;j++){
            var output = outputs[j];
            links.push({
                from: txHash,
                to: output.addr,
                value: output.value,
                t:"o"
            });
        }
        if (garbageidle < Date.now())   {
            graph.forEachNode(function(node){
                if (node && node.data)  {
                    if (node.data.a < Date.now() - maxage - node.links.length * 25) {
                        var lin;
                        graph.forEachLinkedNode(node.id,function(linkedNode,link){
                            var toid = link.toId;
                            lin = linkedNode;
                            graph.removeLink(link);
                        });
                        graph.removeNode(node.id);
                        //if (lin && lin.id)    {
                        //  graph.removeNode(lin.id);
                        //}
                        if (!paused)    {
                            renderer.rerender();
                        }
                        garbageidle = Date.now() + 1000;
                    }
                }
            }); 
        }
    }
    else if (msg.op == "block") {
/*              graph.addNode(txHash,{s:msg.x.totalBTCSent,i:msg.x.txIndexes});
        if (paused)
            renderer.pause();
        graph.forEachNode(function(node){
            var ui = graphics.getNodeUI(node.id);
            if ((node.id).substring(0,6) != "000000")   {
                ui.size =  getNodeSize(node);
            }
            else    {
                ui.size = node.data.s / 3000000000;
            }
        })*/
    }
    // flush the buffer if not empty
    if (! paused && linksBuffer.length > 0) {
        for(var i=0;i<linksBuffer.length;i++){
            var link = linksBuffer[i];
            
            addNodes(link)
            graph.addLink(link.from,link.to);
        }
        linksBuffer = [];
    }
    
    for(var i=0;i<links.length;i++){
        var link = links[i];
        if(link.value > maxNodeSize){
                maxNodeSize = link.value;
        }
            
        if (! paused) {
            addNodes(link);
            graph.addLink(link.from,link.to);
            graph.forEachLinkedNode(link.from,function(linkedNode,link){
                if (linkedNode.data)    {
                    linkedNode.data.a = Date.now();
                }
                else    {
                    linkedNode.data = {a:Date.now()};
                }
            });
        } else{
            // add links to a buffer
            linksBuffer.push(link);
        }
        //writeToScreen('<span style="color: blue;">from: ' + link.from+' to ' +link.to+' value: '+ (link.value/100000000)+'</span>'); 
    }
    //websocket.close(); 
}
function onError(evt) { 
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
}
function doSend(message) { 
    //writeToScreen("SENT: " + JSON.stringify(message));
    websocket.send(JSON.stringify(message));
}

function writeToScreen(message) { 
    var pre = document.createElement("p"); 
    pre.style.wordWrap = "break-word"; 
    pre.innerHTML = message; 
    output.appendChild(pre); 
}  
window.addEventListener("load", init, false);  
window.l = layout;
window.g = graph;
window.r = renderer;

$("input[name='scaleType']").change(function(){
    scaleType = this.value;
    graph.forEachNode(function(node){
        var ui = graphics.getNodeUI(node.id);
        if ((node.id).substring(0,6) != "000000")   {
            ui.size =  getNodeSize(node);
        }
        else    {
            ui.size = node.data.s / 3000000000;
        }
    })
});
