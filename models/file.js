/* jshint esversion: 8 */

var moment = require('moment');

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

	contract.prototype.getLink = function () {
		return `<a href="/user/show/${this.user.id}">${moment(this.sign_date).format('DD.MM.YYYY')}</a>`;
	}

	file.prototype.getLink = function (models) {
		if (this.ref_table === 'user') {
			return `<a href="/user/show/${this.user.id}#show_file_${this.id}">${this.filename}</a>`;
		} else if (this.ref_table.startsWith('template_')) {
			return `<a href="/admin/templates#show_file_${this.id}">${this.filename}</a>`;
		} else if (this.ref_table.startsWith('infopack')) {
			return `<a href="/admin/infopack#show_file_${this.id}">${this.filename}</a>`;
		} else {
			return this.filename;
		}
	};


	file.prototype.getDescriptor = function (models) {
		console.log(this.ref_table);
		if (this.ref_table === 'user') {
			return "Dokument " + this.getLink() + " für " + this.user.getLink();
		} else if (this.ref_table === 'template_contract') {
			return "Dokumentvorlage " + this.getLink() + " für Verträge";
		} else if (this.ref_table === 'template_account_notification') {
			return "Dokumentvorlage " + this.getLink() + " für Buchhaltung";
		} else if (this.ref_table === 'template_user') {
			return "Dokumentvorlage " + this.getLink() + " für Kreditgeber*innen";
		} else if (this.ref_table === 'infopack_balance') {
			return "Jahresabschluss für Kreditgeber*innen " + this.getLink();
		} else if (this.ref_table === 'infopack_infopack') {
			return "Direktkreditinformation für Kreditgeber*innen " + this.getLink();
		} else if (this.ref_table === 'infopack_other') {
			return "Infodokument für Kreditgeber*innen " + this.getLink();
		} else {
			return "Datei " + this.getLink();
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
