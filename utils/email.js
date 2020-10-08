const nodemailer = require('nodemailer');
const settings = require('../utils/settings');
const utils = require('./');

const models  = require('../models');

const fromAddress = (req) => {
	return settings.project.get('email') || 'no-reply@'+req.headers.host;
}

const sendMail = (from, recipient, subject, body) => {
	return Promise.resolve()
		.then(() => {
			if (!recipient || recipient === '') {
				throw "Keine E-Mailadresse hinterlegt";
			}
			var transporter;
			if (settings.project.get('smtp.host')) {
				var options = settings.project.get('smtp');
				transporter = nodemailer.createTransport(options);
			} else if (process.env.HABIDAT_DK_SENDGRID_USER && process.env.HABIDAT_DK_SENDGRID_PASSWORD) {
				transporter = nodemailer.createTransport({
			      service: 'SendGrid',
			      auth: {
			        user: process.env.HABIDAT_DK_SENDGRID_USER,
			        pass: process.env.HABIDAT_DK_SENDGRID_PASSWORD
			      }
			    });
			} else {
				throw "No mail settings found (neither SMTP nor SENDGRID)";
			}
			const mailOptions = {
			    to: recipient,
			    from: from,
			    subject: subject,
			    html: body
			};
			return transporter.sendMail(mailOptions);
		})
}

exports.sendPasswordMail = function(req, res, user) {
	return utils.renderToText(req, res, 'email/setpassword', {link: 'https://'+req.headers.host+utils.generateUrl(req, '/getpassword/'+user.passwordResetToken)})
		.then(emailBody => sendMail(fromAddress(req), user.email, 'Setze dein Passwort für die ' + settings.project.get('projectname') + ' Direktkreditplattform', emailBody));
}


exports.sendTransactionEmail = function(req, res, transaction, contract, user) {
	return utils.renderToText(req, res, 'email/transaction', {user: user, contract: contract, transaction: transaction})
		.then(emailBody => {
			var subject;
			if (transaction.type === 'initial' || transaction.type === 'deposit') {
				subject = 'Dein Direktkredit für ' + settings.project.get('projectname') + ' ist angekommen!';
			} else if (transaction.type === 'notreclaimed') {
				subject = 'Dein Kreditnachlass bei ' + settings.project.get('projectname') + ' wurde vermerkt!';
			} else if (transaction.type === 'termination') {
				subject = 'Die Rückzahlung deines Direktkredites bei ' + settings.project.get('projectname') + ' wurde veranlasst!';
			} else if (transaction.type === 'withdrawal') {
				subject = 'Die (Teil-)Rückzahlung deines Direktkredites bei ' + settings.project.get('projectname') + ' wurde veranlasst!';
			} else if (transaction.type === 'interestpayment') {
				subject = 'Die Zinsauszahlung für deinen Direktkredit bei ' + settings.project.get('projectname') + ' wurde veranlasst!';
			}

			return sendMail(fromAddress(req), user.email, subject, emailBody)
				.then(() => {
						return models.transactionLog.create({
							changes: emailBody,
					      	target_id: transaction.id,
					      	action: 'email',
					      	user_id: req.user.id
				      	});
					});
	});
}