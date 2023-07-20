/* jshint esversion: 8 */

const moment = require("moment");
const format = require("../utils/format");
const settings = require("../utils/settings");
const _t = require("../utils/intl")._t;
const intl = require("../utils/intl");
const utils = require("../utils");
const interestUtils = require("../utils/interest");

module.exports = (sequelize, DataTypes) => {
  contract = sequelize.define(
    "contract",
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
      },
      sign_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      interest_payment_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      termination_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      termination_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        displayOnly: true,
      },
      termination_period: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      termination_period_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
      },
      interest_rate: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
      },
      interest_method: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
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
      tableName: "contract",
      freezeTableName: true,
    }
  );

  contract.associate = function (db) {
    db.contract.hasMany(db.transaction, {
      targetKey: "id",
      foreignKey: "contract_id",
    });
    db.contract.belongsTo(db.user, {
      onDelete: "CASCADE",
      foreignKey: "user_id",
    });
  };

  contract.findByIdFetchFull = function (models, id) {
    return models.contract.findOne({
      where: { id: id },
      include: [{ model: models.transaction, as: "transactions" }],
    });
  };

  contract.getColumns = function (interestYear) {
    return {
      contract_sign_date: {
        id: "contract_sign_date",
        label: "Vertragsdatum",
        priority: "2",
        filter: "date",
      },
      contract_id: {
        id: "contract_id",
        label: "Vertragsnummer",
        filter: "text",
      },
      contract_amount: {
        id: "contract_amount",
        label: "Vertragswert",
        class: "text-right",
        filter: "number",
      },
      contract_interest_rate: {
        id: "contract_interest_rate",
        label: "Zinssatz",
        class: "text-right",
        filter: "number",
      },
      contract_interest_method: {
        id: "contract_interest_method",
        label: "Alternative Zinsberechnung",
        filter: "text",
      },
      contract_deposit: {
        id: "contract_deposit",
        label: "Einzahlungen",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_withdrawal: {
        id: "contract_withdrawal",
        label: "Rückzahlungen",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_interest_paid: {
        id: "contract_interest_paid",
        label: "Zinsauszahlungen",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_not_reclaimed: {
        id: "contract_not_reclaimed",
        label: "Nicht rückgefordert",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_amount_to_date: {
        id: "contract_amount_to_date",
        label: "Aushaftend",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_interest_to_date_old: {
        id: "contract_interest_to_date_old",
        label: "Zinsen alt",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_interest_to_date: {
        id: "contract_interest_to_date",
        label: "Zinsen",
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_interest_of_year: {
        id: "contract_interest_of_year",
        label: "Zinsen " + interestYear,
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_interest_payment_type: {
        id: "contract_interest_payment_type",
        label: "Zinsauszahlung",
        class: "text-right",
        filter: "number",
      },
      contract_termination_type: {
        id: "contract_termination_type",
        label: "Kündigungsart",
        filter: "list",
        displayOnly: true,
      },
      contract_termination_date: {
        id: "contract_termination_date",
        label: "Kündigungsdatum",
        filter: "date",
      },
      contract_payback_date: {
        id: "contract_payback_date",
        label: "Rückzahlungsdatum",
        filter: "date",
        displayOnly: true,
      },
      contract_status: {
        id: "contract_status",
        label: "Status",
        class: "text-center",
        priority: "2",
        filter: "list",
        displayOnly: true,
      },
      contract_has_interest: {
        id: "contract_has_interest",
        label: "Zinssatz > 0",
        class: "text-center",
        priority: "2",
        filter: "list",
        displayOnly: true,
      },
      contract_deposit_date: {
        id: "contract_deposit_date",
        label: "Einzahlungsdatum",
        class: "text-right",
        filter: "date",
      },
      contract_deposit_amount: {
        id: "contract_deposit_amount",
        label: "Einzahlungsbetrag (Import)",
        class: "text-right",
        filter: "number",
        importOnly: true,
      },
      contract_notes: {
        id: "contract_notes",
        label: "Vertragsnotizen",
        filter: "text",
      },
      contract_user_id: {
        id: "contract_user_id",
        label: "Kontonummer",
        filter: "text",
      },
    };
  };

  contract.validateOrGenerateId = function (id = undefined, increment = 1) {
    return Promise.resolve().then(() => {
      if (!!id) {
        return contract.findByPk(id).then((taken) => {
          if (taken) {
            throw "Vertragsnummer " + id + " bereits vergeben";
          } else {
            return id;
          }
        });
      } else {
        return contract.max("id").then((id) => {
          return id + increment;
        });
      }
    });
  };

  contract.prototype.getRow = function (
    effectiveDate = undefined,
    interestYear = undefined
  ) {
    var contract = this;
    var interestToDateOld =
      Math.round(contract.getInterestToDate(moment(effectiveDate)) * 100) / 100;
    var totals = contract.calculateToDate(moment(effectiveDate), interestYear);
    var depositDate = contract.getDepositDate();
    return {
      contract_sign_date: {
        valueRaw: contract.sign_date,
        value: moment(contract.sign_date).format("DD.MM.YYYY"),
        order: moment(contract.sign_date).format("YYYY/MM/DD"),
      },
      contract_id: { valueRaw: contract.id, value: contract.id },
      contract_amount: {
        valueRaw: contract.amount,
        value: format.formatMoney(contract.amount, 2),
        order: contract.amount,
      },
      contract_interest_rate: {
        valueRaw: contract.interest_rate,
        value: format.formatPercent(contract.interest_rate, 2),
        order: contract.interest_rate,
      },
      contract_interest_method: {
        valueRaw: contract.interest_method,
        value: _t("interest_method_" + contract.interest_method),
      },
      contract_deposit: {
        valueRaw: totals.deposits,
        value: format.formatMoney(totals.deposits, 2),
        order: totals.deposits,
        class: totals.deposits > 0 ? "text-success" : "",
      },
      contract_withdrawal: {
        valueRaw: totals.withdrawals,
        value: format.formatMoney(totals.withdrawals, 2),
        order: totals.withdrawals,
        class: totals.withdrawals < 0 ? "text-danger" : "",
      },
      contract_interest_paid: {
        valueRaw: totals.interestPaid,
        value: format.formatMoney(totals.interestPaid, 2),
        order: totals.interestPaid,
        class: totals.interestPaid < 0 ? "text-danger" : "",
      },
      contract_not_reclaimed: {
        valueRaw: totals.notReclaimed,
        value: format.formatMoney(totals.notReclaimed, 2),
        order: totals.notReclaimed,
      },
      contract_amount_to_date: {
        valueRaw: totals.end,
        value: format.formatMoney(totals.end),
        order: totals.end,
      },
      contract_interest_to_date_old: {
        valueRaw: interestToDateOld,
        value: format.formatMoney(interestToDateOld),
        order: interestToDateOld,
      },
      contract_interest_to_date: {
        valueRaw: totals.interest,
        value: format.formatMoney(totals.interest),
        order: totals.interest,
      },
      contract_interest_of_year: {
        valueRaw: totals.interestOfYear,
        value: format.formatMoney(totals.interestOfYear),
        order: totals.interestOfYear,
      },
      contract_interest_payment_type: {
        valueRaw: intl._t(
          "interest_payment_type_" + contract.getInterestPaymentType()
        ),
        value: intl._t(
          "interest_payment_type_" + contract.getInterestPaymentType()
        ),
      },
      contract_termination_type: {
        valueRaw: contract.getTerminationTypeFullString(),
        value: contract.getTerminationTypeFullString(),
      },
      contract_termination_date: {
        valueRaw: contract.termination_date ? contract.termination_date : "",
        value: contract.termination_date
          ? moment(contract.termination_date).format("DD.MM.YYYY")
          : "",
        order: contract.termination_date
          ? moment(contract.termination_date).format("YYYY/MM/DD")
          : "",
      },
      contract_payback_date: {
        valueRaw: contract.getPaybackDate()
          ? contract.getPaybackDate().format("YYYY-MM-DD")
          : "",
        value: contract.getPaybackDate()
          ? moment(contract.getPaybackDate()).format("DD.MM.YYYY")
          : "",
        order: contract.getPaybackDate()
          ? moment(contract.getPaybackDate()).format("YYYY/MM/DD")
          : "",
      },
      contract_status: {
        valueRaw: contract.getStatus(),
        value: contract.getStatus(),
      },
      contract_has_interest: {
        valueRaw: contract.interest_rate > 0,
        value: contract.interest_rate > 0,
      },
      contract_deposit_date: {
        valueRaw: depositDate ? depositDate : "",
        value: depositDate ? moment(depositDate).format("DD.MM.YYYY") : "",
        order: depositDate ? moment(depositDate).format("YYYY/MM/DD") : "",
      },
      contract_deposit_amount: {
        valueRaw: 0,
        value: 0,
        order: 0,
      },
      contract_notes: { valueRaw: contract.notes, value: contract.notes },
      contract_user_id: { valueRaw: contract.user_id, value: contract.user_id },
    };
  };

  contract.prototype.isTerminated = function (date) {
    // check if all money was paid back until given date
    var count = 0;
    var toDate = date;
    this.transactions.forEach(function (transaction) {
      if (moment(toDate).diff(transaction.transaction_date) >= 0) {
        count++;
      }
    });
    var sum = this.calculateToDate(date, undefined).end;
    return count > 1 && sum < 1.0; // check if < 1 to account for rounding issues with older methods of interest calculation
  };

  // get first deposit (initial) transaction date
  contract.prototype.getDepositDate = function () {
    var depositDate;
    this.transactions.forEach(function (transaction) {
      if (transaction.type === "initial") {
        if (depositDate) {
          if (moment(depositDate).isAfter(transaction.transaction_date)) {
            depositDate = transaction.transaction_date;
          }
        } else {
          depositDate = transaction.transaction_date;
        }
      }
    });
    if (depositDate) {
      return moment(depositDate);
    } else {
      return;
    }
  };

  contract.prototype.getRuntime = function (date) {
    // note transactions need to be sorted
    if (this.isTerminated(date) && this.transactions.length > 0) {
      return Math.abs(
        this.getDepositDate().diff(
          moment(
            this.transactions[this.transactions.length - 1].transaction_date
          ),
          "days"
        )
      );
    } else {
      return Math.abs(this.getDepositDate().diff(date, "days"));
    }
  };

  contract.prototype.getTerminationType = function () {
    return (
      this.termination_type ||
      settings.project.get("defaults.termination_type") ||
      "T"
    );
  };

  contract.prototype.getTerminationPeriod = function () {
    return (
      this.termination_period ||
      settings.project.get("defaults.termination_period") ||
      6
    );
  };

  contract.prototype.getTerminationPeriodType = function () {
    return (
      this.termination_period_type ||
      settings.project.get("defaults.termination_period_type") ||
      6
    );
  };

  contract.prototype.getInterestPaymentType = function () {
    return (
      this.interest_payment_type ||
      settings.project.get("defaults.interest_payment_type") ||
      "end"
    );
  };

  contract.getTerminationTypeFullString = function (
    type,
    period,
    period_type,
    noPeriod = false
  ) {
    if (type === "P") {
      return (
        _t("termination_type_P") +
        " - " +
        period +
        " " +
        _t("termination_period_type_" + period_type)
      );
    } else if (type === "D") {
      return _t("termination_type_D");
    } else if (type === "T") {
      return (
        _t("termination_type_T") +
        (noPeriod
          ? ""
          : " - " + period + " " + _t("termination_period_type_" + period_type))
      );
    }
  };

  contract.prototype.getTerminationTypeFullString = function (
    noPeriod = false
  ) {
    return contract.getTerminationTypeFullString(
      this.getTerminationType(),
      this.getTerminationPeriod(),
      this.getTerminationPeriodType(),
      noPeriod
    );
  };

  contract.prototype.getPaybackDate = function () {
    if (this.getTerminationType() == "P") {
      return moment(this.sign_date).add(
        this.getTerminationPeriod(),
        this.getTerminationPeriodType()
      );
    } else if (this.getTerminationType() == "D") {
      return moment(this.termination_date);
    } else if (this.getTerminationType() == "T") {
      if (this.termination_date) {
        return moment(this.termination_date).add(
          this.getTerminationPeriod(),
          this.getTerminationPeriodType()
        );
      } else {
        return null;
      }
    }
  };

  contract.prototype.getFetchedTransactions = function () {
    return this.transactions;
  };

  contract.prototype.getStatus = function () {
    return this.isTerminated(moment())
      ? "Zurückbezahlt"
      : this.transactions.length == 0
      ? "Noch nicht eingezahlt"
      : "Laufend";
  };

  contract.prototype.getStatusValue = function () {
    var now = moment();
    if (this.getDepositDate() && this.getDepositDate().isBefore(now)) {
      if (this.isTerminated(now)) {
        return "cancelled";
      } else {
        return "running";
      }
    } else {
      return "notDeposited";
    }
  };

  contract.prototype.getStatusText = function () {
    switch (this.status) {
      case "unknown":
        return "Noch kein Vertrag";
      case "sign":
        return "Vertrag ist zu unterschreiben";
      case "sent":
        return "Vertrag ist verschickt";
      case "complete":
        return "Vertrag abgeschlossen ";
    }
    return "Unbekannt";
  };

  contract.prototype.getLink = function (req) {
    if (this.user) {
      var url = utils.generateUrl(
        req,
        `/user/show/${this.user.id}#show_contract_${this.id}`
      );
      return `<a href="${url}">${moment(this.sign_date).format(
        "DD.MM.YYYY"
      )}</a>`;
    } else {
      return moment(this.sign_date).format("DD.MM.YYYY");
    }
  };

  contract.prototype.getDescriptor = function (req, models) {
    if (this.user) {
      return `Vertrag vom ${this.getLink(req)} von ${this.user.getLink(req)}`;
    } else {
      return `Vertrag vom ${this.getLink(req)}`;
    }
  };

  contract.prototype.sortTransactions = function () {
    this.transactions.sort(function (a, b) {
      if (a.transaction_date > b.transaction_date) return 1;
      else if (b.transaction_date > a.transaction_date) return -1;
      else return 0;
    });
  };

  // TODO delete (old interest calculation)
  contract.prototype.getInterestToDate = function (date) {
    var sum = 0;
    var contract = this;
    this.transactions.forEach(function (transaction) {
      if (moment(date).diff(transaction.transaction_date) >= 0) {
        sum += transaction.interestToDate(
          contract.interest_rate,
          contract.interest_method,
          date
        );
      }
    });
    if (sum > 0) {
      return Math.ceil(sum * 100) / 100;
    } else {
      return 0;
    }
  };

  contract.prototype.getTransactionsOfYear = function (year) {
    return this.transactions.filter((transaction) => {
      return moment(transaction.transaction_date).year() == year;
    });
  };

  contract.prototype.calculateToDate = function (
    toDate = undefined,
    interestYearParameter = undefined,
    currentTransactionId = undefined
  ) {
    const interestYear =
      interestYearParameter || moment(toDate).subtract(1, "year").year();
    return this.calculatePerYear(moment(toDate), currentTransactionId).reduce(
      (total, entry) => {
        total.end = entry.end;
        total.withdrawals += entry.withdrawals;
        total.deposits += entry.deposits;
        total.notReclaimed += entry.notReclaimed;
        total.interestPaid += entry.interestPaid;
        total.interest += entry.interest;
        if (entry.year == interestYear) {
          total.interestOfYear = entry.interest;
        }
        return total;
      },
      {
        end: 0,
        withdrawals: 0,
        deposits: 0,
        notReclaimed: 0,
        interestPaid: 0,
        interest: 0,
        interestOfYear: 0,
      }
    );
  };

  contract.prototype.calculatePerYear = function (
    toDateParameter = undefined,
    currentTransactionId = undefined
  ) {
    const toDate = moment(toDateParameter);
    const method = interestUtils.splitMethod(this.interest_method);
    if (this.transactions.length === 0) {
      return [];
    } else {
      this.sortTransactions();
      var firstYear = moment(this.transactions[0].transaction_date).year();
      if (firstYear > toDate.year()) {
        return [];
      }
      var lastYear = toDate.year();
      var years = [
        {
          year: firstYear,
          begin: 0,
          withdrawals: 0,
          deposits: 0,
          notReclaimed: 0,
          interestPaid: 0,
          interestBaseAmount: 0, // to calculate with no compound methods
        },
      ];
      for (let year = firstYear; year <= lastYear; year++) {
        const currentYear = years[years.length - 1];
        var amount = currentYear.begin;
        var interestBaseAmount = currentYear.interestBaseAmount;
        // calculate interest for new transactions of year
        var interest = 0;
        this.getTransactionsOfYear(year).forEach((transaction) => {
          if (
            toDate.isSameOrAfter(transaction.transaction_date) &&
            currentTransactionId != transaction.id
          ) {
            amount += transaction.amount;
            if (method.compound || transaction.type !== "interestpayment") {
              interestBaseAmount += transaction.amount;
              interest += interestUtils.calculateInterestDaily(
                moment(transaction.transaction_date),
                year === lastYear ? toDate : undefined,
                transaction.amount,
                this.interest_rate,
                this.interest_method
              );
            }
            switch (transaction.type) {
              case "withdrawal":
              case "termination":
                currentYear.withdrawals += transaction.amount;
                break;
              case "initial":
              case "deposit":
                currentYear.deposits += transaction.amount;
                break;
              case "notreclaimed":
                currentYear.notReclaimed += transaction.amount;
                break;
              case "interestpayment":
                currentYear.interestPaid += transaction.amount;
                break;
            }
          }
        });

        // calculate interest for existing balance
        if (year === lastYear) {
          interest += interestUtils.calculateInterestDaily(
            undefined,
            toDate,
            currentYear.interestBaseAmount,
            this.interest_rate,
            this.interest_method
          );
        } else {
          interest +=
            (currentYear.interestBaseAmount * this.interest_rate) / 100;
        }
        currentYear.interest = Math.round(interest * 100) / 100;
        currentYear.end = amount + currentYear.interest;
        if (year !== lastYear) {
          years.push({
            year: year + 1,
            begin: currentYear.end,
            withdrawals: 0,
            deposits: 0,
            notReclaimed: 0,
            interestPaid: 0,
            interestBaseAmount:
              interestBaseAmount + (method.compound ? currentYear.interest : 0),
          });
        }
      }
      return years;
    }
  };

  contract.prototype.getTransactionsAmount = function () {
    var sum = 0;
    var contract = this;
    this.transactions.forEach(function (transaction) {
      sum += transaction.amount;
    });
    return sum;
  };

  contract.prototype.isCancelledAndNotRepaid = function (date) {
    // check if all money was paid back until given date
    var sum = 0;
    var count = 0;
    var toDate = date;
    this.transactions.forEach(function (transaction) {
      if (moment(toDate).diff(transaction.transaction_date) >= 0) {
        count++;
        sum += transaction.amount;
      }
    });
    var cancelled = sum > 0 && this.termination_date != null;
    var terminated = false;
    if (
      this.termination_date ||
      this.getTerminationType() == "P" ||
      this.getTerminationType() == "D"
    ) {
      terminated = true;
    }
    return sum > 0 && terminated;
  };

  return contract;
};
