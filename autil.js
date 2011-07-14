var http=require("http");
var net=require("net");

exports.jid_parse = function(jid) {
	/* Parses a full JID and returns an object containing 3 fields:
	 *
	 * username: The part before the @ sign
	 * domain  : The domain part of the JID (between @ and /)
	 * resource: The resource of the JID. May be undefined if not set
	 *
	 */
	var parts = jid.match(/^([^@]+)@([^\/]+)(\/([\S]+))?$/);
	if (!parts || !(parts instanceof Array) || parts.length < 5) {
		parts = repeat('', 5);
	}

	return {
		username: parts[1], 
		domain:   parts[2], 
		resource: parts[4],
		toString: function(){
					return this.username+"@"+this.domain+"/"+this.resource;
				}
	};
}

exports.decode64=function(encoded)
{
	return (new Buffer(encoded, 'base64')).toString('utf8');
}

exports.encode64=function(decoded)
{
	return (new Buffer(decoded, 'utf8')).toString('base64');
}

exports.randomstring=function()
{
	var l=5+Math.floor(Math.random()*5);
	var chars="0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
	var str="";
	for(var i=0;i<l;i++)
	{
		var n=Math.floor(Math.random()*chars.length);
		str+=chars.substr(n,1);
	}
	return str;
}

exports.xmlHttpRequest=function(options,cb,body)
{
	var hr=http.request(options,function(response){
		var xdata="";
		response.on('data',function(chunk){
			xdata += chunk.toString();
		});
		response.on('end',function(){
			logIt("DEBUG","response: "+xdata);
			cb(false,xdata);
		});
		response.on('error',function(ee){
			cb(true,ee.toString());
		});
	});
	hr.setHeader("Connection", "Keep-Alive");
	hr.on('error',function(ee){
		cb(true,ee.toString());
	});
	logIt("DEBUG","request: "+body);
	if(body)
	{
		hr.setHeader("Content-Type","text/xml; charset=utf-8");
		hr.setHeader("Content-Length",body.length.toString());
		hr.write(body);
	}
	hr.end();
}

var loglevel="INFO";
exports.setloglevel=function(ss)
{
	ss=ss.toUpperCase();
	if(!loglevels[ss])
		ss="INFO";
	loglevel=ss;
}
var loglevels={
	FATAL:0,
	ERROR:1,
	DATA:2,
	INFO:3,
	DEBUG:4,
};
function logIt(type,quote)
{
	//handle logging levels
	if(loglevels[type])
	{
		if(loglevels[type]<=loglevels[loglevel])
			console.log(type+": "+quote);
	}
}
exports.logIt=logIt;
var msocket=[];	
exports.createSpareSockets=function(count,host,port)
{
	var i;
	for(i=0;i<count;i++)
	{
		createSocket(i,port,host);
	}
}
function createSocket(i,port,host)
{
		msocket[i]=net.createConnection(port,host);
		msocket[i].on('data',function(chunk){
			//can do something with the data arrived
			logIt("ERROR","Unexpected data arrived on an spare socket. Data: "+chunk);
		});
		msocket[i].on('error',function(exception){
			logIt("ERROR",exception)
		});
		msocket[i].on('close',function(had_error){
			if(had_error)
				logIt("ERROR","Spare Socket Closed(Some transmission error)");
			else	
			{
				logIt("INFO","Spare Socket trying to get Closed");
				createSocket(i,port,host);	//creating again[must be closing due to inactivity]
			}
		});
}
