const nodemailer = require('nodemailer');
const settings = require('../utils/settings');
const utils = require('./');

exports.sendPasswordMail = function(req, res, user) {
	return utils.renderToText(req, res, 'email/setpassword', {link: 'https://'+req.headers.host+'/getpassword/'+user.passwordResetToken})
		.then(emailBody => {
			var transporter;
			if (process.env.HABIDAT_DK_SMTP_HOST) {
				var options = {
			      host: process.env.HABIDAT_DK_SMTP_HOST,
			      port: process.env.HABIDAT_DK_SMTP_PORT || 25
			    }
			    if (process.env.HABIDAT_DK_SMTP_USER && process.env.HABIDAT_DK_SMTP_PASSWORD) {
			    	options.auth = {
			    		user: process.env.HABIDAT_DK_SMTP_USER,
			        	pass: process.env.HABIDAT_DK_SMTP_PASSWORD
			    	}
			    }
				transporter = nodemailer.createTransport(options);
			} else if (process.env.HABIDAT_DK_SENDGRID_USER && process.env.HABIDAT_DK_SENDGRID_PASSWORD) {
				transporter = nodemailer.createTransport({
			      service: 'SendGrid',
			      auth: {
			        user: process.env.HABIDAT_DK_SENDGRID_USER,
			        pass: process.env.HABIDAT_DK_SENDGRID_PASSWORD
			      }
			    });
			    const mailOptions = {
				    to: user.email,
				    from: 'no-reply@'+req.headers.host,
				    subject: 'Setze dein Passwort für die ' + settings.project.get('projectname') + ' Direktkreditplattform',
				    html: emailBody
				};
			}

			return transporter.sendMail(mailOptions);
		});
}