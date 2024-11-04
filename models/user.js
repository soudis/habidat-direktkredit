/* jshint esversion: 8 */
const moment = require("moment");
const Op = require("sequelize").Op;
const settings = require("../utils/settings");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const utils = require("../utils");
const format = require("../utils/format");
const intl = require("../utils/intl");
const { first } = require("lodash");

module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define(
    "user",
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      logon_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      salutation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title_prefix: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title_suffix: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      street: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      zip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      place: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      telno: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      IBAN: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      BIC: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      account_notification_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      membership_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      relationship: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordHashed: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      loginCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes_public: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      tableName: "user",
      freezeTableName: true,
    }
  );

  User.beforeCreate((user) => {
    user.logon_id = Math.abs(Math.random() * 100000000);
  });

  User.afterCreate((user) => {
    var id;
    if (user.id.toString().length <= 4) {
      id = ("0000" + user.id.toString()).substring(user.id.toString().length);
    } else {
      id = user.id.toString();
    }
    var suffix = settings.project.get("usersuffix");
    var field = suffix.match(/{(.*)}/i);
    var logon_id;
    if (field == null) {
      logon_id = id + "_" + suffix;
    } else {
      var fieldValue = user.getRow()[field[1]];
      logon_id =
        id +
        "_" +
        (fieldValue && fieldValue.value
          ? fieldValue.value.split(" ").join("_").toLowerCase()
          : "direktkredit");
    }

    return user.update(
      {
        logon_id: logon_id,
      },
      {
        where: {
          id: user.id,
        },
        trackOptions: utils.getTrackOptions(user, false),
      }
    );
  });

  User.beforeValidate((user) => {
    if (user.password && user.password !== "") {
      var salt = bcrypt.genSaltSync(10);
      user.passwordHashed = bcrypt.hashSync(user.password, salt);
      user.password = "";
    }
  });

  User.associate = function (db) {
    db.user.hasMany(db.contract, {
      foreignKey: "user_id",
    });

    db.user.hasMany(db.file, {
      foreignKey: "ref_id",
      scope: {
        ref_table: "user",
      },
    });
  };

  User.findByIdFetchFull = function (models, id) {
    return models.user.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: models.contract,
          as: "contracts",
          include: {
            model: models.transaction,
            as: "transactions",
          },
        },
        {
          model: models.file,
          as: "files",
        },
      ],
      order: [
        [
          {
            model: models.contract,
            as: "contracts",
          },
          "sign_date",
        ],
        [
          {
            model: models.contract,
            as: "contracts",
          },
          {
            model: models.transaction,
            as: "transactions",
          },
          "transaction_date",
        ],
      ],
    });
  };

  User.prototype.deepDelete = function () {
    return Promise.all(
      this.contracts.map((contract) => contract.deepDelete())
    ).then(this.destroy({ trackOptions: utils.getTrackOptions(this, false) }));
  };

  User.deepDelete = function (models, whereClause) {
    return User.findFetchFull(models, whereClause).then((users) =>
      Promise.all(users.map((user) => user.deepDelete()))
    );
  };

  User.findFetchFull = function (
    models,
    whereClause,
    contractFilter = undefined
  ) {
    return models.user
      .findAll({
        where: whereClause,
        include: {
          model: models.contract,
          as: "contracts",
          include: {
            model: models.transaction,
            as: "transactions",
          },
        },
        order: [
          ["last_name"],
          ["first_name"],
          [
            {
              model: models.contract,
              as: "contracts",
            },
            "sign_date",
          ],
          [
            {
              model: models.contract,
              as: "contracts",
            },
            {
              model: models.transaction,
              as: "transactions",
            },
            "transaction_date",
          ],
        ],
      })
      .then((users) => {
        if (contractFilter) {
          users.forEach(function (user) {
            var contracts = [];
            user.contracts.forEach(function (contract) {
              if (contractFilter(user, contract)) {
                contracts.push(contract);
              }
            });
            user.contracts = contracts;
          });
          return users.filter((user) => {
            return user.contracts.length > 0;
          });
        } else {
          return users;
        }
      });
  };

  User.getUsers = function (models, mode, date = Date.now()) {
    return models.user.findFetchFull(models, {}).then((users) => {
      return users.filter((user) => {
        return (
          mode == "all" ||
          (mode === "active" && user.isActive()) ||
          (mode === "cancelled" && user.isTerminated())
        );
      });
    });
  };

  User.cancelledAndNotRepaid = function (models, whereClause) {
    return models.user.findFetchFull(models, whereClause).then((users) => {
      var usersCancelled = [];
      var now = moment();
      users.forEach(function (user) {
        var contracts = [];
        user.contracts.forEach(function (contract) {
          if (contract.isCancelledAndNotRepaid(now)) {
            contracts.push(contract);
          }
        });
        user.contracts = contracts;
      });
      return users.filter((user) => {
        return user.contracts.length > 0;
      });
    });
  };

  User.findByToken = function (token) {
    return User.findOne({ where: { passwordResetToken: token } }).then(
      (user) => {
        if (!user || moment().isAfter(moment(user.passwordResetExpires))) {
          throw "Der Link ist abgelaufen, bitte versuche es noch einmal";
        } else {
          return user;
        }
      }
    );
  };

  User.emailAddressTaken = function (email) {
    return User.count({ where: { email: email } }).then((count) => {
      return count !== 0;
    });
  };

  User.validateEmailAddress = function (email, ignoreWarning = false) {
    return Promise.resolve().then(() => {
      if (!email || email === "") {
        if (!ignoreWarning) {
          throw new utils.Warning(
            "Ohne E-Mailadresse kann sich der*die Kreditgeber*in nicht einloggen"
          );
        } else {
          return;
        }
      } else {
        return User.emailAddressTaken(email).then((taken) => {
          if (taken) {
            throw "E-Mailadresse " + email + " wird bereits verwendet";
          } else {
            return;
          }
        });
      }
    });
  };

  User.validateOrGenerateId = function (id = undefined, increment = 1) {
    return Promise.resolve().then(() => {
      if (id && id !== "") {
        return User.findByPk(id).then((taken) => {
          if (taken) {
            throw "Kontonummer " + id + " bereits vergeben";
          } else {
            return id;
          }
        });
      } else {
        return User.max("id").then((id) => {
          return id + increment;
        });
      }
    });
  };

  User.getColumns = function () {
    return {
      user_id: { id: "user_id", label: "Kontonummer", filter: "text" },
      user_type: {
        id: "user_type",
        label: "Benutzer*innentyp",
        filter: "list",
      },
      user_is_person: {
        id: "user_is_person",
        label: "Indikator ob Benutzer*in eine natürliche Person ist",
        filter: "text",
        displayOnly: true,
      },

      user_salutation: {
        id: "user_salutation",
        label: "Anrede",
        filter: "text",
      },
      user_is_formal: {
        id: "user_is_formal",
        label: "Indikator für formelle Anrede",
        filter: "text",
        displayOnly: true,
      },
      user_title_prefix: {
        id: "user_title_prefix",
        label: "Titel",
        filter: "text",
      },
      user_first_name: {
        id: "user_first_name",
        label: "Vorname",
        filter: "text",
      },
      user_last_name: {
        id: "user_last_name",
        label: "Nachname",
        filter: "text",
      },
      user_title_suffix: {
        id: "user_title_suffix",
        label: "Titel, nachgestellt",
        filter: "text",
      },
      user_name: {
        id: "user_name",
        label: "Name",
        priority: "2",
        filter: "text",
        displayOnly: true,
      },
      user_address: {
        id: "user_address",
        label: "Adresse",
        filter: "text",
        displayOnly: true,
      },
      user_address_oneline: {
        id: "user_address_oneline",
        label: "Adresse (einzeilig)",
        filter: "text",
        displayOnly: true,
      },
      user_telno: { id: "user_telno", label: "Telefon", filter: "text" },
      user_email: { id: "user_email", label: "E-Mail", filter: "text" },
      user_iban: { id: "user_iban", label: "IBAN", filter: "text" },
      user_bic: { id: "user_bic", label: "BIC", filter: "text" },
      user_relationship: {
        id: "user_relationship",
        label: "Beziehung",
        filter: "list",
      },
      user_membership_status: {
        id: "user_membership_status",
        label: "Mitgliedsstatus",
        filter: "list",
      },
      user_street: { id: "user_street", label: "Strasse", filter: "text" },
      user_zip: { id: "user_zip", label: "PLZ", filter: "text" },
      user_place: { id: "user_place", label: "Ort", filter: "text" },
      user_country: { id: "user_country", label: "Land", filter: "text" },
      user_logon_id: {
        id: "user_logon_id",
        label: "Anmeldename",
        filter: "text",
        displayOnly: true,
      },
      user_account_notification_type: {
        id: "user_account_notification_type",
        label: "Kontomitteilung",
        filter: "list",
      },
      user_notes: {
        id: "user_notes",
        label: "Notizen Kreditgeber*in",
        filter: "text",
      },
    };
  };

  const umlautMap = {
    "\u00dc": "UE",
    "\u00c4": "AE",
    "\u00d6": "OE",
    "\u00fc": "ue",
    "\u00e4": "ae",
    "\u00f6": "oe",
    "\u00df": "ss",
  };

  var replaceUmlaute = function (str) {
    if (str) {
      return str
        .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
          const big = umlautMap[a.slice(0, 1)];
          return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
        })
        .replace(
          new RegExp("[" + Object.keys(umlautMap).join("|") + "]", "g"),
          (a) => umlautMap[a]
        );
    } else {
      return null;
    }
  };

  User.prototype.getFlags = function () {
    let flags = {};
    if (this.type) flags[`user_type_is_${this.type}`] = true;
    return flags;
  };

  User.prototype.getRow = function () {
    var user = this;
    return {
      user_id: { valueRaw: user.id, value: user.id },
      user_type: {
        valueRaw: user.type || "person",
        value: user.type
          ? intl._t("user_type_" + user.type)
          : intl._t("user_type_person"),
      },
      user_is_person: {
        valueRaw: user.type && user.type === "person",
        value: user.type && user.type === "person",
      },
      user_salutation: {
        valueRaw: user.salutation || "personal",
        value: user.salutation
          ? intl._t("user_salutation_" + user.salutation)
          : intl._t("user_salutation_personal"),
      },
      user_is_formal: {
        valueRaw: user.type && user.saluation === "formal",
        value: user.type && user.saluation === "formal",
      },
      user_title_prefix: {
        valueRaw: user.title_prefix,
        value: user.title_prefix,
      },
      user_first_name: { valueRaw: user.first_name, value: user.first_name },
      user_last_name: { valueRaw: user.last_name, value: user.last_name },
      user_title_suffix: {
        valueRaw: user.title_suffix,
        value: user.title_suffix,
      },
      user_name: {
        valueRaw: user.getFullName(),
        value: user.getFullName(),
        order: replaceUmlaute(user.getFullName()),
      },
      user_address: {
        valueRaw: user.getAddress(true),
        value: user.getAddress(true),
      },
      user_address_oneline: {
        valueRaw: user.getAddress(false),
        value: user.getAddress(true),
      },
      user_telno: { valueRaw: user.telno, value: user.telno },
      user_email: { valueRaw: user.email, value: user.email },
      user_iban: { valueRaw: user.IBAN, value: user.IBAN },
      user_bic: { valueRaw: user.BIC, value: user.BIC },
      user_relationship: {
        valueRaw: user.relationship,
        value: user.relationship,
      },
      user_membership_status: {
        valueRaw: user.membership_status,
        value: intl._t("membership_status_" + user.membership_status),
      },
      user_street: { valueRaw: user.street, value: user.street },
      user_zip: { valueRaw: user.zip, value: user.zip },
      user_place: { valueRaw: user.place, value: user.place },
      user_country: { valueRaw: user.country, value: user.country },
      user_logon_id: { valueRaw: user.logon_id, value: user.logon_id },
      user_account_notification_type: {
        valueRaw: user.account_notification_type || "online",
        value: intl._t(
          "account_notification_type_" +
            (user.account_notification_type || "online")
        ),
      },
      user_notes: { valueRaw: user.notes, value: user.notes },
    };
  };

  User.prototype.getAddress = function (lineBreak = false) {
    var address = "";
    if (this.street) {
      address += this.street;
      if (lineBreak) {
        address += "</br>";
      } else {
        address += ", ";
      }
    }
    if (this.country) {
      address += this.country;
      if (this.zip) {
        address += "-";
      }
    }
    if (this.zip) {
      address += this.zip;
    }
    if (this.place) {
      if (address != "") {
        address += " ";
      }
      address += this.place;
    }
    return address;
  };

  User.prototype.getOldestContract = function () {
    var oldest;
    this.contracts.forEach((contract) => {
      if (!oldest || moment(oldest.sign_date).isAfter(contract.sign_date)) {
        oldest = contract;
      }
    });
    return oldest;
  };

  User.prototype.getLastWithdrawal = function () {
    var newest;
    this.contracts.forEach((contract) => {
      contract.transactions.forEach((transaction) => {
        if (
          transaction.amount < 0 &&
          (!newest ||
            moment(transaction.transaction_date).isAfter(
              newest.transaction_date
            ))
        ) {
          newest = transaction;
        }
      });
    });
    return newest?.transaction_date;
  };

  User.prototype.getFullName = function () {
    var name = this.first_name;
    if (this.type === "organisation") {
      return name;
    } else {
      if (this.last_name) {
        name = this.last_name.toUpperCase() + " " + name;
      }
      if (this.title_prefix) {
        name = this.title_prefix + " " + name;
      }
      if (this.title_suffix) {
        name = name + ", " + this.title_suffix;
      }
      return name;
    }
  };

  User.prototype.getFullNameNoTitle = function () {
    var name = this.first_name;
    if (this.type === "organisation") {
      return name;
    } else {
      if (this.last_name) {
        name = this.last_name.toUpperCase() + " " + name;
      }
      return name;
    }
  };

  User.prototype.getLink = function (req) {
    var url = utils.generateUrl(req, `/user/show/${this.id}`);
    return `<a href="${url}">${this.getFullName()}</a>`;
  };

  User.prototype.getDescriptor = function (req, models) {
    return `Stammdaten von ${this.getLink(req)}`;
  };

  User.prototype.comparePassword = function comparePassword(
    candidatePassword,
    cb
  ) {
    return bcrypt.compareSync(candidatePassword, this.passwordHashed);
  };

  User.prototype.setPasswordResetToken = function () {
    this.passwordResetToken = crypto.randomBytes(16).toString("hex");
    this.passwordResetExpires = Date.now() + 3600000 * 168; // 1 week
  };

  User.prototype.hasNotTerminatedContracts = function (date) {
    var notTerminated = false;
    this.contracts.forEach(function (contract) {
      if (
        !(
          contract.termination_date &&
          moment(contract.termination_date).diff(date) <= 0
        )
      ) {
        notTerminated = true;
      }
    });
    return notTerminated;
  };

  User.prototype.calculateToDate = function (
    toDate = undefined,
    interestYear = undefined,
    currentTransactionId = undefined
  ) {
    const totals = {
      amount: 0,
      end: 0,
      withdrawals: 0,
      deposits: 0,
      notReclaimed: 0,
      interestPaid: 0,
      interest: 0,
      interestOfYear: 0,
    };
    this.contracts.forEach((contract) => {
      const contractTotals = contract.calculateToDate(
        toDate,
        interestYear,
        currentTransactionId
      );
      totals.amount += contract.amount;
      totals.end += contractTotals.end;
      totals.withdrawals += contractTotals.withdrawals;
      totals.deposits += contractTotals.deposits;
      totals.notReclaimed += contractTotals.notReclaimed;
      totals.interestPaid += contractTotals.interestPaid;
      totals.interest += contractTotals.interest;
      totals.interestOfYear += contractTotals.interestOfYear;
    });
    return totals;
  };

  User.prototype.isActive = function () {
    var active;
    this.contracts.forEach(function (contract) {
      if (!contract.isTerminated() && contract.getDepositDate()) {
        active = true;
      }
    });
    return active;
  };

  User.prototype.isTerminated = function () {
    var terminated = this.contracts.length > 0;
    this.contracts.forEach(function (contract) {
      if (!contract.isTerminated()) {
        terminated = false;
      }
    });
    return terminated;
  };

  User.prototype.isAdmin = function () {
    return false;
  };

  function generateTransactionList(transactions, name) {
    let data = {};
    data[name] = [];

    var interestTotal = 0,
      interestTotalPaid = 0,
      amountTotalEnd = 0,
      amountTotalBegin = 0,
      lastTransaction;
    transactions.forEach(function (transaction) {
      if (transaction.type.startsWith("Zinsertrag")) {
        interestTotal = interestTotal + transaction.amount;
      }
      if (transaction.type.startsWith("Zinsauszahlung")) {
        interestTotalPaid -= transaction.amount;
      }
      if (transaction.type.startsWith("Kontostand Jahresende")) {
        amountTotalEnd += transaction.amount;
      }
      if (transaction.type.startsWith("Kontostand Jahresbeginn")) {
        amountTotalBegin += transaction.amount;
      }
      data[name].push({
        contract_id: transaction.contract_id,
        contract_interest_rate: format.formatPercent(transaction.interest_rate),
        contract_amount: format.formatMoney(transaction.contract_amount),
        contract_interest_payment_type: intl._t(
          "interest_payment_type_" + transaction.interest_payment_type
        ),
        contract_first_line:
          !lastTransaction ||
          lastTransaction.contract_id !== transaction.contract_id,
        transaction_date: format.formatDate(transaction.date),
        transaction_amount: format.formatMoney(transaction.amount),
        transaction_type: transaction.type,
      });

      lastTransaction = transaction;
    });

    data.interest_total = format.formatMoney(interestTotal);
    data.interest_total_paid = format.formatMoney(interestTotalPaid);
    data.amount_total_end = format.formatMoney(amountTotalEnd);
    data.amount_total_begin = format.formatMoney(amountTotalBegin);
    return data;
  }

  User.prototype.getAccountNotificationData = function (year) {
    var transactionList = this.getTransactionList(year);

    transactionList.sort(function (a, b) {
      if (a.contract_id > b.contract_id) return 1;
      else if (b.contract_id > a.contract_id) return -1;
      else {
        if (a.date.isAfter(b.date, "day")) return 1;
        else if (b.date.isAfter(a.date, "day")) return -1;
        else {
          if (a.order > b.order) return 1;
          else if (a.order < b.order) return -1;
          else return 0;
        }
      }
    });

    let data = {
      ...this.getFlags(),
      ...generateTransactionList(transactionList, "user_transactions_year"),
    };

    let userFields = this.getRow();
    Object.keys(userFields).forEach(
      (field) => (data[field] = userFields[field].value)
    );

    data.user_address = data.user_address.replace("</br>", "\n");
    data.current_date = moment().format("DD.MM.YYYY");
    data.year = year;
    data[`is${data.year}`] = true;
    data[`is_year_${data.year}`] = true;

    data.user_contracts = this.contracts.map((contract) => {
      let contractData = {};
      const contractFields = contract.getRow();
      Object.keys(contractFields).forEach(
        (field) => (contractData[field] = contractFields[field].value)
      );

      contractData.contract_transactions = contract.transactions.map(
        (transaction) => {
          let transactionData = {};
          const transactionFields = transaction.getRow();
          Object.keys(transactionFields).forEach(
            (field) => (transactionData[field] = transactionFields[field].value)
          );
          return transactionData;
        }
      );
      contractData.current_date = moment().format("DD.MM.YYYY");
      contractData.contract_transactions_year = [];

      const flags = contract.getFlags();

      // also set flags on user level
      Object.keys(flags).forEach((flag) => {
        data[flag.replace("contract", "user")] = flags[flag];
      });

      return {
        ...contractData,
        ...flags,
        ...generateTransactionList(
          transactionList.filter((row) => row.contract_id === contract.id),
          "contract_transactions_year"
        ),
      };
    });
    console.log(data);
    return data;
  };

  User.prototype.getTransactionList = function (year) {
    var transactionList = [];
    var user = this;
    var firstDay = moment(year + " +00:00", "YYYY Z");
    var firstDayNextYear = moment(year + " +00:00", "YYYY Z").add(1, "years");
    var lastDay = moment(year + " +00:00", "YYYY Z").endOf("year");
    this.contracts.forEach(function (contract) {
      const years = contract.calculatePerYear(firstDayNextYear);
      const currentYear = years.find((y) => y.year == year);
      if (
        currentYear &&
        !contract.isTerminated(moment(firstDay).subtract(1, "days"))
      ) {
        const currentYear = years.find((y) => y.year == year);
        const lastTransaction =
          contract.transactions && contract.transactions.length > 0
            ? contract.transactions[contract.transactions.length - 1]
                .transaction_date
            : undefined;
        // begin balance
        if (currentYear.begin > 0) {
          transactionList.push({
            id: user.id,
            last_name: user.last_name,
            first_name: user.first_name,
            contract_id: contract.id,
            contract_amount: contract.amount,
            interest_rate: contract.interest_rate,
            date: firstDay,
            type: "Kontostand Jahresbeginn",
            amount: currentYear.begin,
            interest: 0, // TODO: Interest accumulated until beginning of year?
            interest_payment_type: contract.getInterestPaymentType(),
            order: 0,
          });
        }
        if (!contract.isTerminated(lastDay)) {
          transactionList.push({
            id: user.id,
            last_name: user.last_name,
            first_name: user.first_name,
            contract_id: contract.id,
            contract_amount: contract.amount,
            interest_rate: contract.interest_rate,
            date: moment(lastDay),
            type: "Kontostand Jahresende",
            amount: currentYear.end,
            interest: currentYear.interest, // TODO: Interest accumulated until beginning of year?
            interest_payment_type: contract.getInterestPaymentType(),
            order: 4,
          });
        }
        transactionList.push({
          id: user.id,
          last_name: user.last_name,
          first_name: user.first_name,
          contract_id: contract.id,
          contract_amount: contract.amount,
          interest_rate: contract.interest_rate,
          date:
            contract.isTerminated(lastDay) && lastTransaction
              ? moment(lastTransaction)
              : moment(lastDay),
          type: "Zinsertrag " + year,
          amount: currentYear.interest,
          interest: "",
          interest_payment_type: contract.getInterestPaymentType(),
          order: 2,
        });
        contract.getTransactionsOfYear(year).forEach((transaction) => {
          transactionList.push({
            id: user.id,
            last_name: user.last_name,
            first_name: user.first_name,
            contract_id: contract.id,
            contract_amount: contract.amount,
            interest_rate: contract.interest_rate,
            date: moment(transaction.transaction_date),
            type: transaction.getTypeText(),
            amount: transaction.amount,
            interest: "",
            interest_payment_type: contract.getInterestPaymentType(),
            order: transaction.type === "interestpayment" ? 3 : 1,
          });
        });
      }
    });
    return transactionList;
  };

  return User;
};
