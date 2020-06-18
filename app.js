/* jshint esversion: 8 */
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
	const utils = require('./utils');
	const settings = require('./utils/settings');
	const sass = require('node-sass-middleware');

	mkdirp('tmp', function(err) { });
	mkdirp('upload', function(err) { });

	var models  = require('./models');

	require('./utils/security/passport')(passport);

	var session      = require('express-session');
	var FileStore = require('session-file-store')(session);

	var app = express();



	var router = express.Router();

	var oneDay = 86400000;

	router.use('/public', express.static(path.join(__dirname, 'public'),  { maxAge: oneDay }));
	router.use('/favicon.ico', express.static(path.join(__dirname, 'public/favicon.png')));
	router.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-bs4/js'),  { maxAge: oneDay }));
	router.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-bs4/css'),  { maxAge: oneDay }));
	router.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net/js'),  { maxAge: oneDay }));
	router.use('/public/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'),  { maxAge: oneDay }));
	router.use('/public/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist'),  { maxAge: oneDay }));
	router.use('/public/moment', express.static(path.join(__dirname, 'node_modules/moment/min'),  { maxAge: oneDay }));
	router.use('/public/moment/locale', express.static(path.join(__dirname, 'node_modules/moment/locale'),  { maxAge: oneDay }));
	router.use('/public/datepicker', express.static(path.join(__dirname, 'node_modules/bootstrap-datepicker/dist/js'),  { maxAge: oneDay }));
	router.use('/public/datepicker', express.static(path.join(__dirname, 'node_modules/bootstrap-datepicker/dist/css'),  { maxAge: oneDay }));
	router.use('/public/select', express.static(path.join(__dirname, 'node_modules/bootstrap-select/dist/js'),  { maxAge: oneDay }));
	router.use('/public/bootbox', express.static(path.join(__dirname, 'node_modules/bootbox/dist'),  { maxAge: oneDay }));
	router.use('/public/chart.js', express.static(path.join(__dirname, 'node_modules/chart.js/dist'),  { maxAge: oneDay }));
	router.use('/public/popper', express.static(path.join(__dirname, 'node_modules/@popperjs/core/dist/umd'),  { maxAge: oneDay }));
	router.use('/public/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts'), { maxAge: oneDay }));
	router.use('/public/multiselect', express.static(path.join(__dirname, 'node_modules/bootstrap-multiselect/dist/js'), { maxAge: oneDay }));
	router.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-responsive/js'), { maxAge: oneDay }));
	router.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-responsive-bs4/js'), { maxAge: oneDay }));
	router.use('/public/datatables', express.static(path.join(__dirname, 'node_modules/datatables.net-responsive-bs4/css'), { maxAge: oneDay }));
	router.use('/public/slider', express.static(path.join(__dirname, 'node_modules/bootstrap-slider/dist'),  { maxAge: oneDay }));

	const umlautMap = {
		'\u00dc': 'UE',
		'\u00c4': 'AE',
		'\u00d6': 'OE',
		'\u00fc': 'ue',
		'\u00e4': 'ae',
		'\u00f6': 'oe',
		'\u00df': 'ss',
	};

	var replaceUmlaute = function (str) {
		return str
		.replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
			const big = umlautMap[a.slice(0, 1)];
			return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
		})
		.replace(new RegExp('['+Object.keys(umlautMap).join('|')+']',"g"),
			(a) => umlautMap[a]
			);
	};

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
		store: new FileStore(),
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
	};

	app.use(function(req,res,next){
		res.locals.session = req.session;
		res.locals.settings = settings;
		if (req.user) {
			res.locals.currentUser = req.user;
		}

		res.locals.moment = require('moment');
		res.locals._url = function(url) {
			return utils.generateUrl(req,url);
		}
		res.locals.siteurl = 'https://' + req.host + utils.generateUrl(req, '/');
		res.locals.siteurl = res.locals.siteurl.substring(0, res.locals.siteurl.length - 1);
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


	require('./routes/contract')(router);
	require('./routes/normaluser')(router);
	require('./routes/other')(router);
	require('./routes/procrastinate')(router);
	require('./routes/root')(router);
	require('./routes/statistics')(router);
	require('./routes/transaction')(router);
	require('./routes/user')(router);
	require('./routes/file')(router);
	require('./routes/communication')(router);
	require('./routes/admin')(router);
	require('./routes/process')(router);

	app.use(sass({
		src: path.join(__dirname, '/'),
		dest: path.join(__dirname, '/'),
		debug: true
	}));

	app.use('/', router);
	var projectId = settings.project.get('projectid');
	if (projectId) {
		app.use('/'+projectId, (req,res,next) => {
			req.addPath = '/'+projectId;
			next();
		})
		app.use('/'+projectId, router);
		app.use(sass({
			src: path.join(__dirname, '/'),
			dest: path.join(__dirname, '/'),
			prefix: '/'+projectId,
			debug: true
		}));
	}

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	app.use(function(err, req, res, next) {
		if (settings.config.get('debug')) {
			console.log(err);
		}
		if (req.xhr || req.headers.accept.indexOf('json') > -1) {
			res.status(err.status || 500);
			res.render('partials/error', {
				message: err.message,
				error: err
			}, (renderError, html) => {
				res.json({html: html, error: err.message?err.message:err});
			});
		} else {
		  res.render('error', {message: err.message, error: err, title: 'Uups..'});
		}

	});

	module.exports = app;

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
}catch(e) {
	console.log(e.stack);
}