const nodemailer = require('nodemailer');
const settings = require('../utils/settings');
const utils = require('./');

exports.sendPasswordMail = function(req, res, user) {
	return utils.renderToText(req, res, 'email/setpassword', {link: 'https://'+req.headers.host+'/getpassword/'+user.passwordResetToken})
		.then(emailBody => {
			var transporter = nodemailer.createTransport({
		      service: 'SendGrid',
		      auth: {
		        user: process.env.SENDGRID_USER,
		        pass: process.env.SENDGRID_PASSWORD
		      }
		    });
		    const mailOptions = {
			    to: user.email,
			    from: 'no-reply@'+req.headers.host,
			    subject: 'Setze dein Passwort für die ' + settings.project.get('projectname') + ' Direktkreditplattform',
			    html: emailBody
			};
			return transporter.sendMail(mailOptions);
		});
}