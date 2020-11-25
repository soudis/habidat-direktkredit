/* jshint esversion: 8 */

var moment = require('moment');
const utils = require('../utils');

module.exports = (sequelize, DataTypes) => {
	file = sequelize.define('file',
	{
		id: {
			type: DataTypes.INTEGER(11),
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		filename: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true
		},
		mime: {
			type: DataTypes.STRING,
			allowNull: false
		},
		path: {
			type: DataTypes.STRING,
			allowNull: false
		},
		public: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false
		},
		ref_id:  {
			type: DataTypes.INTEGER(11),
			allowNull: true
		},
		ref_table:  {
			type: DataTypes.STRING,
			allowNull: false
		}

	}, {
		tableName: 'file',
		freezeTableName: true,
	});

	file.associate = function (db) {
		db.file.belongsTo(db.user, {
			onDelete: "CASCADE",
			foreignKey: 'ref_id'
		});
	};

	file.prototype.getLink = function (req) {
		if (this.ref_table === 'user') {
			var url = utils.generateUrl(req, `/user/show/${this.user.id}#show_file_${this.id}`);		
			return `<a href="${url}">${this.filename}</a>`;
		} else if (this.ref_table.startsWith('template_')) {
			var url = utils.generateUrl(req, `/admin/templates#show_file_${this.id}`);		
			return `<a href="${url}">${this.filename}</a>`;
		} else if (this.ref_table.startsWith('infopack')) {
			var url = utils.generateUrl(req, `/admin/infopack#show_file_${this.id}`);	
			return `<a href="${url}">${this.filename}</a>`;
		} else {
			return this.filename;
		}
	};


	file.prototype.getDescriptor = function (req, models) {
		console.log(this.ref_table);
		if (this.ref_table === 'user') {
			return "Dokument " + this.getLink(req) + " für " + this.user.getLink(req);
		} else if (this.ref_table === 'template_contract') {
			return "Dokumentvorlage " + this.getLink(req) + " für Verträge";
		} else if (this.ref_table === 'template_account_notification') {
			return "Dokumentvorlage " + this.getLink(req) + " für Buchhaltung";
		} else if (this.ref_table === 'template_user') {
			return "Dokumentvorlage " + this.getLink(req) + " für Kreditgeber*innen";
		} else if (this.ref_table === 'infopack_balance') {
			return "Jahresabschluss für Kreditgeber*innen " + this.getLink(req);
		} else if (this.ref_table === 'infopack_infopack') {
			return "Direktkreditinformation für Kreditgeber*innen " + this.getLink(req);
		} else if (this.ref_table === 'infopack_other') {
			return "Infodokument für Kreditgeber*innen " + this.getLink(req);
		} else {
			return "Datei " + this.getLink(req);
		}
	};

	file.getContractTemplates = function(){
		return this.findAll({
			where: {
				ref_table: "template_contract"
			}
		});
	};

	file.getUserTemplates = function(){
		return this.findAll({
			where: {
				ref_table: "template_user"
			}
		});
	};

	file.getFilesFor = function (ref_table, ref_id) {
		return this.findAll({
			where: {
				ref_table: ref_table,
				ref_id: ref_id
			}
		});
	};


	return file;
};
