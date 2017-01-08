var models  = require('../../models');
var moment = require("moment");
var validator = require("validator");

var functions = {};

functions.WBHOOE = function(income, habitants, size){
   var sockel = 580;
   var multiplikatoren = [ 1.67, 2.27, 2.97, 3.77, 4.57, 5.37, 5.17, 5.97, 6.77, 7.57];
   var anrechenbarerAufwand = 3.5;
   var anrechenbareGroesse = [ 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
   
   var gewichtetesEinkommen = sockel * multiplikatoren[habitants-1];
   var zumutbarerWohnungsaufwand = Math.max(income - gewichtetesEinkommen,0);
   
   var anrechenbarerWohnungsaufwand = Math.min(size, anrechenbareGroesse[habitants-1])*anrechenbarerAufwand;
   
   var wohnbeihilfe = Math.min(anrechenbarerWohnungsaufwand - zumutbarerWohnungsaufwand, 200);
   var wohnbeihilfe = Math.max(wohnbeihilfe, 0);
   
   return wohnbeihilfe;

};

exports.calculate = function(generalConfig) {
	
	
	var baseHabitants = {};
	var availHabitants = [];
	var baseConfiguration = {flats: {}, usedHabitants: {}, usedHabitantsCount: 0};
	var baseFlats = [];
    var configurations = [];
    var maxConfigurations = 10;
	
    generalConfig.flats.forEach(function(flat) {
		baseFlats.push( flat);
		baseConfiguration.flats[flat.id] = {flat: flat, habitants: []};
	});
	
    generalConfig.habitants.forEach(function(habitant){
		if (habitant.fixed_to_flat !== null) {
			baseHabitants[habitant.id] = habitant;
			baseConfiguration.flats[habitant.fixed_to_flat].habitants.push(habitant);
		} else {
			availHabitants.push(habitant);
		}
	});
	
	var cloneObject = function(object) {
		var clone = {};
		for (var attr in object){
			clone[attr] = object[attr];
		} 
		return clone;
	};
	
	var cloneArray = function(object) {
		var clone = [];
		for (var i = 0; i< object.length; i++) {
			clone.push(object[i]);
		}
		return clone;
	};
	
	var cloneConfig = function(configuration) {
		var clone = {flats: {}, usedHabitants: {}, usedHabitantsCount: configuration.usedHabitantsCount};
		clone.usedHabitants = cloneObject(configuration.usedHabitants);
		for(var attr in configuration.flats) {
			clone.flats[attr] = {
				flat: configuration.flats[attr].flat, 
				habitants: cloneArray(configuration.flats[attr].habitants)
			};
		}
		return clone;
	};
	
	var calculateAndStore = function(configuration) {
		var sum = 0;
		// calculation flats and total sum
		for (var attr in configuration.flats) {
			var income = 0;
			for (var i = 0; i < configuration.flats[attr].habitants.length; i++) {
				income += configuration.flats[attr].habitants[i].income;
			}
			configuration.flats[attr].calcValue = functions[generalConfig.calculation_mode](income, configuration.flats[attr].habitants.length, configuration.flats[attr].flat.size);
			sum += configuration.flats[attr].calcValue;
		}
		configuration.calcValue = sum;
		configuration.usedHabitants = null;
		// push configuration to configurations array
		configurations.push(configuration);
		// sort by value
		configurations.sort(function(a,b) {
			return b.calcValue - a.calcValue;
		});
		// pop last entry if size of configurations array is bigger than max configurations
		if (configurations.length > maxConfigurations) {
			configurations.pop();
		}
	};
	
	var permutateFlats;
	
	var permutateHabitants = function(index, n, deep, flatIndex, remHabitants, configuration) {
		//var configuration = cloneConfig(currentConfiguration);
		console.log("Permutate Habitants, Index: " + index +" n: " + n + " deep: " + deep);
		//console.log(JSON.stringify(configuration, null, 2));
		var currentFlatId = baseFlats[flatIndex].id;
		
		// if recursion depth is reached
		if (deep === n) {
			// if all habitants have a flat assigned
			if (configuration.usedHabitantsCount === availHabitants.length) {
				console.log("STORED");
				calculateAndStore(configuration);
		    // if not, permutate remaining habitants to other flats
			} else {
				permutateFlats(flatIndex + 1, configuration);
			}
		} else {
			for (var i = index; i<remHabitants.length; i++) {
				// assign habitant to flat
				var clonedConfig = cloneConfig(configuration);
				clonedConfig.flats[currentFlatId].habitants.push(remHabitants[i]);
				clonedConfig.usedHabitants[remHabitants[i].id] = remHabitants[i];
				clonedConfig.usedHabitantsCount ++;
				// recursive call to permutate other habitants to remaining flat space
				permutateHabitants(i + 1, n, deep+1, flatIndex, remHabitants, clonedConfig);
			}
		}
	};
	
	permutateFlats = function(flatIndex, configuration) {
		
		
		if (flatIndex >= baseFlats.length){
			return;
		}
		
		// calculate remaining habitants
		var remHabitants = [];		
		for (var i = 0; i< availHabitants.length; i++) {
			if (!configuration.usedHabitants[availHabitants[i].id]) {
				remHabitants.push(availHabitants[i]);
			}
		}
		
		// TODO size of fixed habitants instead of hardcoded 1 !!!
		var maxPermutate = Math.min(baseFlats[flatIndex].max_habitant-baseFlats[flatIndex].min_habitant-1, remHabitants.length);
		console.log("Permutate Flat: " + flatIndex + " maxPermutate: " + maxPermutate);
		
		// loop from min size to max size minus fixed habitants
		for (var j=0; j<=maxPermutate; j++) {
			// calculate all habitant combinations
			permutateHabitants(0, j, 0, flatIndex, remHabitants, configuration);
		}
	};
	
	permutateFlats(0, baseConfiguration);
	
	return configurations;
};


