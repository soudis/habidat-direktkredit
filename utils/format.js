/* jshint esversion: 8 */
const numeral = require('numeral');
const moment = require('moment');

numeral.register('locale', 'de', {
	delimiters: {
		thousands: '.',
		decimal: ','
	},
	currency: {
		symbol: '€'
	}
});

numeral.locale('de');

exports.format = function(number, precision, formatString) {
	precisionString = "";
	for (var i = 0; i< precision; i++) {
		if (i==0) precisionString = ".";
		precisionString += '0';
	}
	var numberString = numeral(number).format("0,0"+precisionString);
	return formatString.replace("#", numberString);
};

exports.formatNumber= function(percent, precision) {
	return exports.format(percent, precision, "#");
};


exports.formatDate = function(date) {
	return moment(date).format("DD.MM.YYYY");
};

exports.formatMoney = function(money, precision = 2) {
	return exports.format(money, precision, "# €");
};

exports.formatPercent = function(percent, precision = 2) {
	return exports.format(percent, precision, "# %");
};

