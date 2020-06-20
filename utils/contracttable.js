const settings = require('./settings');
const utils = require('./');
const models  = require('../models');
const moment = require('moment');
const format = require('./format');
const intl = require('./intl');

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



exports.contractTableRow = function(user, contract = undefined, effectiveDate = undefined, interestYear = undefined) {
	if (contract) {
		var interestToDate = Math.round(contract.getInterestToDate(moment(effectiveDate))*100)/100;
		var amountToDate = Math.round(contract.getAmountToDate(moment(effectiveDate))*100)/100;
		var interestOfYear = Math.round(contract.getInterestOfYear(interestYear)*100)/100;
		return [
			{ valueRaw: contract.sign_date, value: moment(contract.sign_date).format('DD.MM.YYYY'), order: moment(contract.sign_date).format('YYYY/MM/DD') },
			{ valueRaw: user.id, value:  user.id  },
			{ valueRaw: user.getFullName(), value: user.getFullName(), order: replaceUmlaute(user.getFullName())},
			{ valueRaw: user.getAddress(true), value: user.getAddress(true) },
			{ valueRaw: user.telno, value: user.telno },
			{ valueRaw: user.email, value: user.email },
			{ valueRaw: user.IBAN, value: user.IBAN },
			{ valueRaw: user.BIC, value: user.BIC },
			{ valueRaw: user.relationship, value: user.relationship },
			{ valueRaw: contract.id, value: contract.id },
			{ valueRaw: contract.amount, value: format.formatMoney(contract.amount,2), order: contract.amount},
			{ valueRaw: contract.interest_rate, value: format.formatPercent(contract.interest_rate,3), order: contract.interest_rate},
			{ valueRaw: contract.getDepositAmount(), value: format.formatMoney(contract.getDepositAmount(), 2), order: contract.getDepositAmount(), class: contract.getDepositAmount()>0?"text-success":""},
			{ valueRaw: contract.getWithdrawalAmount(), value: format.formatMoney(contract.getWithdrawalAmount(), 2), order: contract.getWithdrawalAmount(), class: contract.getWithdrawalAmount()<0?"text-danger":"" },
			{ valueRaw: amountToDate, value: format.formatMoney(amountToDate), order: amountToDate },
			{ valueRaw: interestToDate, value: format.formatMoney(interestToDate), order: interestToDate },
			{ valueRaw: interestOfYear, value: format.formatMoney(interestOfYear), order: interestOfYear },
			{ valueRaw: intl._t('interest_payment_type_'+contract.getInterestPaymentType()), value: intl._t('interest_payment_type_'+contract.getInterestPaymentType())},
			{ valueRaw: contract.getTerminationTypeFullString(), value: contract.getTerminationTypeFullString()},
			{ valueRaw: contract.termination_date?contract.termination_date:"", value: contract.termination_date?moment(contract.termination_date).format('DD.MM.YYYY'):"", order: contract.termination_date?moment(contract.termination_date).format('YYYY/MM/DD'):""},
			{ valueRaw: contract.getPaybackDate()?contract.getPaybackDate().format('YYYY-MM-DD'):"", value: contract.getPaybackDate()?moment(contract.getPaybackDate()).format('DD.MM.YYYY'):"", order: contract.getPaybackDate()?moment(contract.getPaybackDate()).format('YYYY/MM/DD'):""},
			{ valueRaw: contract.getStatus(), value: contract.getStatus() }
		];
	} else {
		return [
			false,
			{ valueRaw: user.id, value:  user.id  },
			{ valueRaw: user.getFullName(), value: user.getFullName(), order: replaceUmlaute(user.getFullName())},
			{ valueRaw: user.getAddress(true), value: user.getAddress(true) },
			{ valueRaw: user.telno, value: user.telno },
			{ valueRaw: user.email, value: user.email },
			{ valueRaw: user.IBAN, value: user.IBAN },
			{ valueRaw: user.BIC, value: user.BIC },
			{ valueRaw: user.relationship, value: user.relationship },
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			false,
			];
	}
};

exports.getContractTableColumns = (pInterestYear = undefined) => {

	var interestYear = pInterestYear ? pInterestYear : moment().subtract(1,'years').year();

	return contractTableColumns = [
			{id: "contract_sign_date", label: "Vertragsdatum", priority: "2", filter: 'date'},
			{id: "user_id", label: "User ID", filter: 'text'},
			{id: "user_name", label: "Name", priority: "2", filter: 'text'},
			{id: "user_address", label: "Adresse", filter: 'text'},
			{id: "user_telno", label:"Telefon", filter: 'text'},
			{id: "user_email", label:"E-Mail", filter: 'text'},
			{id: "user_iban", label:"IBAN", filter: 'text'},
			{id: "user_bic", label: "BIC", filter: 'text'},
			{id: "user_relationship", label:"Beziehung", filter: 'list'},
			{id: "contract_id", label:"Vertrag ID", filter: 'text'},
			{id: "contract_amount", label: "Vertragswert", class: "text-right", filter: 'number'},
			{id: "contract_interest_rate", label: "Zinssatz", class: "text-right", filter: 'number'},
			{id: "contract_deposit", label: "Einzahlungen", class: "text-right", filter: 'number'},
			{id: "contract_withdrawal", label: "Auszahlungen", class: "text-right", filter: 'number'},
			{id: "contract_amount_to_date", label: "Aushaftend", class: "text-right", filter: 'number'},
			{id: "contract_interest_to_date", label: "Zinsen", class: "text-right", filter: 'number'},
			{id: "contract_interest_of_year", label: "Zinsen " + interestYear, class: "text-right", filter: 'number'},
			{id: "contract_interest_payment_type", label: "Zinsauszahlung", class: "text-right", filter: 'number'},
			{id: "contract_termination_type", label: "Kündigungsart", filter: 'list'},
			{id: "contract_termination_date", label: "Kündigungsdatum", filter: 'date'},
			{id: "contract_payback_date", label: "Rückzahlungsdatum", filter: 'date'},
			{id: "contract_status", label: "Status", class: "text-center", priority: "2", filter: 'list'}
		];
}

exports.generateContractTable = (req, res, users, effectiveDate = undefined, pInterestYear = undefined) => {

	var interestYear = pInterestYear ? pInterestYear : moment().subtract(1,'years').year();

	contracts = {
		columns: exports.getContractTableColumns(interestYear),
		setColumnsVisible: function(visibleColumns) {
			this.columns.forEach(column => {
				if (visibleColumns.includes(column.id)) {
					column.visible = true;
				} else {
					column.visible = false;
				}
			});
			return this;
		},
		data: []
	};
	users.forEach(user => {
		if (user.contracts.length === 0) {
			contracts.data.push(exports.contractTableRow(user, undefined, effectiveDate, interestYear));
		}
		user.contracts.forEach(contract => {
			contracts.data.push(exports.contractTableRow(user, contract, effectiveDate, interestYear));
		});
	});
	contracts.columns.forEach((column, index) => {
		if (column.filter === 'list') {
			var options = [];
			contracts.data.forEach(row => {
				if (!options.includes(row[index].value || '-')) {
					options.push(row[index].value || '-');
				}
			});
			column.filterOptions = options;
		}
	});
	return contracts;
}