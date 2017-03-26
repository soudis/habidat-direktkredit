var security = require('../utils/security');
var mixer = require('../utils/mixer');
var router = require('express').Router();
var moment = require('moment');

module.exports = function(app){
	
	router.get('/mixer/main', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.findAll().then(function(configurations){
			res.render('mixer/main', {configurations:configurations, title: 'Bewohner*innenmixer'});
		});
		
	});
	
	router.get('/mixer/test', security.isLoggedInAdmin, function(req, res) {
			res.render('mixer/test', {title: 'Wohnbeihilfe OÖ Test'});
	});

	router.get('/mixer/mix/:id', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.find({
			where : {
				id: req.params.id
			},
			include: [{
				model: models.habitant,
				as: 'habitants'
			}, {
				model: models.flat,
				as: 'flats'
			}]
		}).then(function(configuration) {
		  var resultConfigurations = mixer.calculate(configuration);
		  res.render('mixer/result', {configurations:resultConfigurations, title: 'Bewohner*innenmixer Ergebnis'});
		});
	});
	
	router.post('/mixer/test', security.isLoggedInAdmin, function(req, res) {
		
		var wohnbeihilfe = mixer.wbhOOE(req.body.income, req.body.habitants, req.body.size);
		
		res.render('mixer/test', {wohnbeihilfe: wohnbeihilfe, title: 'Wohnbeihilfe OÖ Test'});
    });
	
	router.get('/mixer/show/:id', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.find({
			where : {
				id: req.params.id
			},
			include: [{
				model: models.habitant,
				as: 'habitants'
			}, {
				model: models.flat,
				as: 'flats'
			}]
		}).then(function(configuration) {
		  res.render('mixer/show', {configuration:configuration, title: 'Bewohner*innenmixer'});
		});
	});
	
	/* Add habitant */
	router.get('/mixer/add_habitant/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.find({
			where : {
				id: req.params.id
			}
		}).then(function(configuration) {
	      models.flat.findAll({order:"name"}).then(function(flats) {
	    	  res.render('mixer/add_habitant', {configuration_id:configuration.id, flats:flats, title: 'Bewohner*in einfügen' });
	      });
		});
	});

	/* Edit habitant */
	router.get('/mixer/edit_habitant/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.habitant.find({
			where : {
				id: req.params.id
			}
		}).then(function(habitant) {
		      models.flat.findAll({order:"name"}).then(function(flats) {
					res.render('mixer/edit_habitant', { habitant:habitant, flats:flats, configuration_id:habitant.configuration, title: 'Bewohner*in bearbeiten' });
		      });
		});
	});
	
	/* Delete habitant */
	router.get('/mixer/delete_habitant/:id', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
		models.habitant.find({
			where: {
				id: req.params.id
			}
		}).then(function(habitant) {
			  habitant.destroy();
			  res.redirect(security.redirectReload(req.headers.referer));
		});	
	});

	router.post('/mixer/add_habitant', security.isLoggedInAdmin, function(req, res) {
		if (req.body.fixed_to_flat === "") {
			req.body.fixed_to_flat = null;
		}
		var models  = require('../models')(req.session.project);
		models.habitant.create({
			name: req.body.name,
			birth_date: moment(req.body.birth_date, 'DD.MM.YYYY'),
			income: req.body.income,
			fixed_to_flat: req.body.fixed_to_flat,
			configuration: req.body.configuration_id
		}).then(function(habitant) {
			res.redirect('/mixer/show/'+req.body.configuration_id);
		}).catch(function(err) {
			console.log("Error: " + err);
			res.redirect('/mixer/show/'+req.body.configuration_id);
		});
	});
	
	router.post('/mixer/edit_habitant', security.isLoggedInAdmin, function(req, res) {
		if (req.body.fixed_to_flat === "") {
			req.body.fixed_to_flat = null;
		}
		var models  = require('../models')(req.session.project);
		models.habitant.update({
			name: req.body.name,
			birth_date: moment(req.body.birth_date, 'DD.MM.YYYY'),
			income: req.body.income,
			fixed_to_flat: req.body.fixed_to_flat,
			configuration: req.body.configuration_id
		}, {where:{id:req.body.id}}).then(function(configuration) {
			res.redirect('/mixer/show/'+req.body.configuration_id);
		}).catch(function(err) {
			console.log("Error: " + err);	
			res.redirect('/mixer/show/'+req.body.configuration_id);
		});
	});


	
	/* Add flat */
	router.get('/mixer/add_flat/:id', security.isLoggedInAdmin, function(req, res, next) {
	    res.render('mixer/add_flat', {configuration_id: req.params.id, title: 'Wohnung einfügen' });
	});

	/* Edit configuration */
	router.get('/mixer/edit_flat/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.flat.find({
			where : {
				id: req.params.id
			}
		}).then(function(flat) {
			res.render('mixer/edit_flat', { configuration_id:flat.configuration, flat:flat, title: 'Wohnung bearbeiten' });
		});
	});
	
	/* Delete configuration */
	router.get('/mixer/delete_flat/:id', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
		models.flat.find({
			where: {
				id: req.params.id
			}
		}).then(function(flat) {
			flat.destroy();
			res.redirect(security.redirectReload(req.headers.referer));
		});	
	});

	router.post('/mixer/add_flat', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.flat.create({
			name: req.body.name,
			min_habitant: req.body.min_habitant,
			max_habitant: req.body.max_habitant,
			size: req.body.size,
			configuration: req.body.configuration_id
		}).then(function(configuration) {
			res.redirect('/mixer/show/'+req.body.configuration_id);
		}).catch(function(err) {
			res.redirect('/mixer/show/'+req.body.configuration_id);
		});
	});
	
	router.post('/mixer/edit_flat', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.flat.update({
			name: req.body.name,
			min_habitant: req.body.min_habitant,
			max_habitant: req.body.max_habitant,
			size: req.body.size	
		}, {where:{id:req.body.id}}).then(function(configuration) {
			res.redirect('/mixer/show/'+req.body.configuration_id);
		}).catch(function(err) {
			res.redirect('/mixer/show/'+req.body.configuration_id);
		});
	});
	
	
	
	
	/* Add configuration */
	router.get('/mixer/add_config', security.isLoggedInAdmin, function(req, res, next) {
		res.render('mixer/add_config', {title: 'Konfiguration einfügen' });
	});

	/* Edit configuration */
	router.get('/mixer/edit_config/:id', security.isLoggedInAdmin, function(req, res, next) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.find({
			where : {
				id: req.params.id
			}
		}).then(function(configuration) {
			res.render('mixer/edit_config', { configuration:configuration, title: 'Konfiguration bearbeiten' });
		});
	});
	
	/* Delete configuration */
	router.get('/mixer/delete_config/:id', security.isLoggedInAdmin, function(req, res) {
		
		var models  = require('../models')(req.session.project);
		models.mixer_config.find({
			where: {
				id: req.params.id
			}
		}).then(function(configuration) {
			configuration.destroy();
			res.redirect(security.redirectReload(req.headers.referer));
		});	
	});

	router.post('/mixer/add_config', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.create({
			name: req.body.name,
			calculation_mode: req.body.calculation_mode
		}).then(function(configuration) {
			res.redirect('/mixer/main');
		}).catch(function(err) {
			res.redirect('/mixer/main');
		});
	});
	
	router.post('/mixer/edit_config', security.isLoggedInAdmin, function(req, res) {
		var models  = require('../models')(req.session.project);
		models.mixer_config.update({
			name: req.body.name,
			calculation_mode: req.body.calculation_mode
		}, {where:{id:req.body.id}}).then(function(configuration) {
			res.redirect('/mixer/main');
		}).catch(function(err) {
			res.redirect('/mixer/main');
		});
	});
	
	app.use('/', router);
};
