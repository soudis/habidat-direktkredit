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
	var userRow = user.getRow();
	if (contract) {
		var contractRow = contract.getRow(effectiveDate, interestYear);
		return [
			contractRow.contract_sign_date,
			userRow.user_id,
			userRow.user_type,
			userRow.user_title_prefix,
			userRow.user_first_name,
			userRow.user_last_name,
			userRow.user_title_suffix,
			userRow.user_name,
			userRow.user_address,
			userRow.user_telno,
			userRow.user_email,
			userRow.user_iban,
			userRow.user_bic,
			userRow.user_relationship,
			contractRow.contract_id,
			contractRow.contract_amount,
			contractRow.contract_interest_rate,
			contractRow.contract_deposit,
			contractRow.contract_withdrawal,
			contractRow.contract_amount_to_date,
			contractRow.contract_interest_to_date,
			contractRow.contract_interest_of_year,
			contractRow.contract_interest_payment_type,
			contractRow.contract_termination_type,
			contractRow.contract_termination_date,
			contractRow.contract_payback_date,
			contractRow.contract_status,
			contractRow.contract_deposit_date
		];
	} else {
		return [
			false,
			userRow.user_id,
			userRow.user_type,
			userRow.user_title_prefix,
			userRow.user_first_name,
			userRow.user_last_name,
			userRow.user_title_suffix,
			userRow.user_name,
			userRow.user_address,
			userRow.user_telno,
			userRow.user_email,
			userRow.user_iban,
			userRow.user_bic,
			userRow.user_relationship,
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
			false,
			];
	}
};

exports.getContractTableColumns = (pInterestYear = undefined) => {

	var interestYear = pInterestYear ? pInterestYear : moment().subtract(1,'years').year();

	userColumns = models.user.getColumns();
	contractColumns = models.contract.getColumns(interestYear);

	return [
			contractColumns.contract_sign_date,
			userColumns.user_id,
			userColumns.user_type,
			userColumns.user_title_prefix,
			userColumns.user_first_name,
			userColumns.user_last_name,
			userColumns.user_title_suffix,
			userColumns.user_name,
			userColumns.user_address,
			userColumns.user_telno,
			userColumns.user_email,
			userColumns.user_iban,
			userColumns.user_bic,
			userColumns.user_relationship,
			contractColumns.contract_id,
			contractColumns.contract_amount,
			contractColumns.contract_interest_rate,
			contractColumns.contract_deposit,
			contractColumns.contract_withdrawal,
			contractColumns.contract_amount_to_date,
			contractColumns.contract_interest_to_date,
			contractColumns.contract_interest_of_year,
			contractColumns.contract_interest_payment_type,
			contractColumns.contract_termination_type,
			contractColumns.contract_termination_date,
			contractColumns.contract_payback_date,
			contractColumns.contract_status,
			contractColumns.contract_deposit_date
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