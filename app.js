try{
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
var numeral = require('numeral');
const intl = require('./utils/intl');
const settings = require('./utils/settings');
const sass = require('node-sass-middleware');

mkdirp('tmp', function(err) { });
mkdirp('upload', function(err) { });

var models  = require('./models');

require('./utils/security/passport')(passport); 

var session      = require('express-session');
var FileStore = require('session-file-store')(session);

var app = express();

app.use(sass({
  src: path.join(__dirname, '/'),
  dest: path.join(__dirname, '/'),
  debug: true
}));

var oneDay = 86400000;

app.use('/public', express.static(path.join(__dirname, 'public'),  { maxAge: oneDay }));
app.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-bs4/js'),  { maxAge: oneDay }));
app.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-bs4/css'),  { maxAge: oneDay }));
app.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net/js'),  { maxAge: oneDay }));
app.use('/public/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'),  { maxAge: oneDay }));
app.use('/public/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist'),  { maxAge: oneDay }));
app.use('/public/moment', express.static(path.join(__dirname, 'node_modules/moment/min'),  { maxAge: oneDay }));
app.use('/public/datepicker', express.static(path.join(__dirname, 'node_modules/bootstrap-datepicker/dist/js'),  { maxAge: oneDay }));
app.use('/public/datepicker', express.static(path.join(__dirname, 'node_modules/bootstrap-datepicker/dist/css'),  { maxAge: oneDay }));
app.use('/public/bootbox', express.static(path.join(__dirname, 'node_modules/bootbox/dist'),  { maxAge: oneDay }));
app.use('/public/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js/dist'),  { maxAge: oneDay }));
app.use('/public/popper', express.static(path.join(__dirname, 'node_modules/@popperjs/core/dist/umd'),  { maxAge: oneDay }));
app.use('/public/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: 31557600000 }));
app.use('/public/multiselect', express.static(path.join(__dirname, 'node_modules/bootstrap-multiselect/dist/js'), { maxAge: 31557600000 }));
app.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-responsive/js'), { maxAge: 31557600000 }));
app.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-responsive-bs4/js'), { maxAge: 31557600000 }));
app.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-responsive-bs4/css'), { maxAge: 31557600000 }));


const umlautMap = {
  '\u00dc': 'UE',
  '\u00c4': 'AE',
  '\u00d6': 'OE',
  '\u00fc': 'ue',
  '\u00e4': 'ae',
  '\u00f6': 'oe',
  '\u00df': 'ss',
}

var replaceUmlaute = function (str) {
  return str
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
      const big = umlautMap[a.slice(0, 1)];
      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(new RegExp('['+Object.keys(umlautMap).join('|')+']',"g"),
      (a) => umlautMap[a]
    );
}



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

if (settings.config.get('site.reverseproxy') === 'true') {
	app.enable('trust proxy');
}

// setup the logger
app.use(logger('common'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());



app.use(session({ 
  secret: 'klasjdf098034lja2309bdjkla789lsdfjsafd098',
  store: new FileStore,
  resave: true,
  saveUninitialized: true})); 
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

const _iv = (object, key) => {
	if (object) {
		return object[key];
	} else {
		return undefined;
	}
}

app.use(function(req,res,next){
  res.locals.session = req.session;
  res.locals.settings = settings;
  res.locals.currentUser = req.user;

  res.locals.moment = require('moment');
  res.locals.replaceUmlaute = replaceUmlaute;
  res.locals.format = require('./utils/format');
  res.locals.sprintf = require('sprintf').sprintf;
  res.locals.models = models;
  res.locals._t = intl._t;
  res.locals._iv = _iv;

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
require('./routes/admin')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
//if (app.get('env') === 'development') {
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('partials/error', {
    message: err.message,
    error: err
  }, (renderError, html) => {
  	res.json({html: html, error: err})
  });
});
//}

module.exports = app;

//models.sequelize.sync().then(function () {
	if (settings.config.get('site.https') === "true") {
	  var privateKey  = fs.readFileSync(settings.config.get('site.sslkey'), 'utf8');
	  var certificate = fs.readFileSync(settings.config.get('site.sslcert'), 'utf8');
	  var credentials = {key: privateKey, cert: certificate};		
	  console.log("starting https server on: " + settings.config.get('site.porthttps').toString());	
	  var httpsServer = https.createServer(credentials, app);
	  httpsServer.listen(parseInt(settings.config.get('site.porthttps')));
	}
	if (settings.config.get('site.http') === "true") {
	  console.log("starting http server on: " + settings.config.get('site.porthttp').toString());
	  var httpServer = http.createServer(app);
	  httpServer.listen(parseInt(settings.config.get('site.porthttp')));
	}
//	});
}catch(e) {
  console.log(e.stack);
}