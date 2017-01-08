var numeral = require('numeral');
var moment = require('moment');

numeral.language('de', {
    delimiters: {
        thousands: '.',
        decimal: ','
    },
    currency: {
        symbol: '€'
    }
});

numeral.language('de');

exports.formatDate = function(date) {
	return moment(date).format("DD.MM.YYYY");
};

exports.formatMoney = function(money) {
	return numeral(money).format("0,0.00 $");
};

exports.formatPercent = function(percent) {
	return numeral(percent).format("0.00 %");
};