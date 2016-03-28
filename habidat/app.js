var express = require('express');
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


var site    = require('./config/site.json');

var privateKey  = fs.readFileSync(site.sslkey, 'utf8');
var certificate = fs.readFileSync(site.sslcert, 'utf8');
var credentials = {key: privateKey, cert: certificate};


var models  = require('./models');

require('./config/passport')(passport); 

var routes = require('./routes/index');
var users = require('./routes/users');
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

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var oneDay = 86400000;

app.use('/public', express.static(__dirname + '/public/',  { maxAge: oneDay }));

app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); 

app.use('/', routes);
app.use('/users', users);

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

models.sequelize.sync().then(function () {
	if (site.https === "true") {
	  console.log("starting https server on: " + site.porthttps.toString());	
	  var httpsServer = https.createServer(credentials, app);
	  httpsServer.listen(site.porthttps);
	}
	if (site.http === "true") {
	  console.log("starting http server on: " + site.porthttp.toString());
	  var httpServer = http.createServer(app);
	  httpServer.listen(site.porthttp);
	}
	});
