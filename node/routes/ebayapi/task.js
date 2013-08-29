/* Call API */
var fs       = require('fs');
var config   = require('../../config');
var mongo    = require('../mongoconnect');
var ObjectID = require('mongodb').ObjectID;
var moment   = require('moment');
var clone    = require('clone');

var running    = 0;
var done       = 0;
var limit      = 5;
var queue      = [];
var userqueue  = {};
var currentidx = 0;

module.exports = {
  
  addqueue: function(requestjson, callback) {
    
    // todo: save into mongodb
    console.log('task addqueue: ' + requestjson.callname + ' ' + requestjson.email);
    
    var username = requestjson.email;
    
    if (queue.indexOf(username) < 0) {
      queue.push(username);
    }
    
    if (!userqueue.hasOwnProperty(username)) {
      userqueue[username] = [];
    }
    userqueue[username].push(
      {
        'requestjson': requestjson,
        'callback': callback
      }
    );
    
    docall();
  },
  
  getnewtokenmap: function(email, callback) {
    
    var newid = new ObjectID();
    
    mongo(function(db) {
      
      db.collection('tokenmap', function(err, collection) {
        collection.insert({
          _id: newid,
          email: email,
          created_at: new Date()
        }, function() {
          callback(null, newid.toHexString());
        });
      });
      
    }); // mongo
    
  },
  
  getemailfromtokenmap: function(tokenid, callback) {
    
    var _id = new ObjectID(tokenid);
    
    mongo(function(db) {
      
      db.collection('tokenmap', function(err, collection) {
        collection.findOne({_id: _id}, function(err, document) {
          callback(document.email);
        });
      });
      
    }); // mongo
    
  },
  
  getebayauthtoken: function(email, userid, callback) {
    
    mongo(function(db) {
      db.collection('users', function(err, collection) {
        collection.find({email: email}).toArray(function(err, users) {
          users[0].userids2.forEach(function(ebayuser) {
            if (ebayuser.username != userid) return;
            
            callback(null, ebayuser.eBayAuthToken);
            
          }); // forEach
        }); // find
      }); // collection
    }); // mongo
    
  }
  
}

function docall() {
  
  while (running < limit && queue.length > 0) {
    
    var username = queue[currentidx];
    var queueelm = userqueue[username].shift();
    var postval = username + '.' + queueelm.requestjson.callname;
    
    if (userqueue[username].length == 0) {
      queue.splice(queue.indexOf(username), 1);
    }
    
    if (currentidx >= (queue.length-1)) {
      currentidx = 0;
    } else {
      currentidx++;
    }
    
    if (queueelm.requestjson.callname == 'downloadFile') {
      
      dopost2(queueelm.requestjson, function(err, resultjson) {
        
        running--;
        done++;
        
        logtaskcount();
        
        queueelm.callback(null, resultjson);
        
        if (queue.length > 0) {
          docall();
        }
      });
      
    } else {
      
      dopost(queueelm.requestjson, function(err, resultjson) {
        
        running--;
        done++;
        
        logtaskcount();
        
        queueelm.callback(null, resultjson);
        
        if (queue.length > 0) {
          docall();
        }
      });
      
    }
    
    running++;
    logtaskcount();
  }
}

function dopost(postjson, callback) {
  
  var fs = require('fs');
  var js2xmlparser = require('js2xmlparser');
  
  /* json -> xml */
  var requestxml = js2xmlparser(postjson.callname, postjson.params);
  
  requestxml = requestxml.replace
  ('<' + postjson.callname + '>', 
   '<' + postjson.callname + ' xmlns="urn:ebay:apis:eBLBaseComponents">');
  
  /* post request */
  var https = require('https');
  
  var options = {
    host: config.apihost,
    port: 443,
    path: config.apipath,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'X-EBAY-API-COMPATIBILITY-LEVEL': config.compatlevel,
      'X-EBAY-API-CALL-NAME': postjson.callname,
      'X-EBAY-API-SITEID':    postjson.siteid,
      'X-EBAY-API-DEV-NAME':  config.devname,
      'X-EBAY-API-APP-NAME':  config.appname,
      'X-EBAY-API-CERT-NAME': config.certname
    }
  };
  
  var req = https.request(options, function(apires) {
    
    apires.setEncoding('utf8');
    
    var resultxml = '';
    
    apires.on('data', function (chunk) {
      resultxml += chunk;
    });
    
    apires.on('end', function (chunk) {
      
      var callname = postjson.callname;
      
      /* xml -> json */
      var xml2js = require('xml2js');
      var parser = xml2js.Parser({
        attrkey: '@',
        charkey: '#text',
        explicitArray: false
      });
      
      /* return to callback */
      parser.parseString(resultxml, function (err, resultjson) {
        
        if (resultjson[callname+'Response'].hasOwnProperty('CorrelationID')) {
          
          var logdir = '/var/www/listers.in/logs/apicall/' + callname;
          if (!fs.existsSync(logdir)) fs.mkdirSync(logdir);
          
          if (resultjson[callname+'Response'].hasOwnProperty('Timestamp')) {
            var timestamp = resultjson[callname+'Response'].Timestamp.replace(/T.+$/, '');
            logdir += '/' + timestamp;
            if (!fs.existsSync(logdir)) fs.mkdirSync(logdir);
          }
          
          var correlationid = resultjson[callname+'Response'].CorrelationID.split(' ');
          
          /*
          if (callname == 'GetMemberMessages') {
            var logfile = logdir + '/' + correlationid.join('_') + '.xml';
            fs.writeFile(logfile, resultxml);
          }
          */
          
          getemailfromtokenmap(correlationid[0], function(email) {
            correlationid[0] = email;
            var logfile = logdir + '/' + correlationid.join('_') + '.xml';
            fs.writeFile(logfile, resultxml);
          });
          
          callback(null, resultjson[callname+'Response']);
          
        } else {
          
          console.dir(resultjson);
          callback(null, resultjson[callname+'Response']);
          
        }
      });  
    });
  });
  
  var logdir = '/var/www/listers.in/logs/apicall';
  var logfile = logdir + '/' + postjson.callname + '/req.xml';
  fs.writeFile(logfile, requestxml);
  
  req.write(requestxml);
  
  req.end();
	
} // dopost()

function dopost2(postjson, callback) {
	
  var zlib = require('zlib');
  var fs = require('fs');
  var js2xmlparser = require('js2xmlparser');
  
  /* json -> xml */
  var requestxml = js2xmlparser(postjson.callname + 'Request', postjson.params);
  
  requestxml = requestxml.replace
  (/<downloadFileRequest>/, 
   '<downloadFileRequest xmlns="http://www.ebay.com/marketplace/services">');
  
  /* post request */
  var https = require('https');
  
  var options = {
    host: config.apiftshost,
    port: 443,
    path: config.apiftspath,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'X-EBAY-SOA-OPERATION-NAME': 'downloadFile',
			'X-EBAY-SOA-SECURITY-TOKEN': config.admintoken
    }
  };
  
  var logdir = '/var/www/sandbox.listers.in/logs/apicall/downloadFile';
  var rawfile = logdir + '/' + postjson.email + '_' + postjson.site + '.raw';
  var zipfile = logdir + '/' + postjson.email + '_' + postjson.site + '.zip';
  
  if (fs.existsSync(zipfile)) {
    callback(null, {zipfile: zipfile});
    return;
  }
  
  var req = https.request(options, function(apires) {
    
    var formidable = require('formidable');
    var form = new formidable.IncomingForm();
    form.uploadDir = logdir;
    
    form.parse(apires, function(err, fields, files) {
      fs.renameSync(files[null].path, zipfile);
      callback(null, {zipfile: zipfile});
    });
    
  });
  
  req.write(requestxml);
  
  req.end();
	
} // dopost2()

function logtaskcount() {
  
  var queuesum = 0;
  for (tmpqueue in userqueue) {
    queuesum += userqueue[tmpqueue].length;
  }
  
  var now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
  
  console.log(now + ' task: ' + queuesum + ' : ' + running + ' : ' + done);
  
  return;
}

function getemailfromtokenmap(tokenid, callback) {
  
  var _id = new ObjectID(tokenid);
  
  mongo(function(db) {
    
    db.collection('tokenmap', function(err, collection) {
      collection.findOne({_id: _id}, function(err, document) {
        callback(document.email);
      });
    });
    
  }); // mongo
  
}