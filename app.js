var express = require('express');
var router = express.Router();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash    = require('connect-flash');
var Sequelize = require('sequelize');
var https = require('https');
var http = require('http');
var fs = require('fs');
var multer = require('multer');
var mkdirp = require('mkdirp');

mkdirp('tmp', function(err) { });
mkdirp('upload', function(err) { });




var migrate = require('./models/migration');
migrate.up();

var site    = require('./config/site.json');
var projects    = require('./config/projects.json');



var models  = require('./models');



require('./utils/security/passport')(passport); 

var session      = require('express-session');

var app = express();

app.locals.moment = require('moment');
app.locals.sprintf = require('sprintf').sprintf;
app.locals.site = site;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

if (site.reverseproxy === 'true') {
	app.enable('trust proxy');
}

// setup the logger
app.use(logger('common'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(multer({dest:'./upload/'}).single('file'));
app.use(flash());

var oneDay = 86400000;

app.use('/public', express.static(__dirname + '/public/',  { maxAge: oneDay }));

app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use(function(req,res,next){
    res.locals.session = req.session;
    if (req.session.project) {
    	res.locals.project = projects[req.session.project];
    }
    var newPrevURLs = [];
    if (req.session.prevURLs && req.session.prevURLs.length >= 1) {
      newPrevURLs.push(req.session.prevURLs[req.session.prevURLs.length-1]);
    }
    newPrevURLs.push(req.originalUrl);
    req.session.prevURLs = newPrevURLs;
    next();
});

require('./routes/contract')(app);
require('./routes/normaluser')(app);
require('./routes/other')(app);
require('./routes/procrastinate')(app);
require('./routes/root')(app);
require('./routes/statistics')(app);
require('./routes/transaction')(app);
require('./routes/user')(app);
require('./routes/file')(app);
require('./routes/communication')(app);
require('./routes/mixer')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

module.exports = app;

//models.sequelize.sync().then(function () {
	if (site.https === "true") {
	  var privateKey  = fs.readFileSync(site.sslkey, 'utf8');
	  var certificate = fs.readFileSync(site.sslcert, 'utf8');
	  var credentials = {key: privateKey, cert: certificate};		
	  console.log("starting https server on: " + site.porthttps.toString());	
	  var httpsServer = https.createServer(credentials, app);
	  httpsServer.listen(site.porthttps);
	}
	if (site.http === "true") {
	  console.log("starting http server on: " + site.porthttp.toString());
	  var httpServer = http.createServer(app);
	  httpServer.listen(site.porthttp);
	}
//	});
