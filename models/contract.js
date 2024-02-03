/* jshint esversion: 8 */

const moment = require("moment");
const format = require("../utils/format");
const settings = require("../utils/settings");
const _t = require("../utils/intl")._t;
const intl = require("../utils/intl");
const utils = require("../utils");
const interestUtils = require("../utils/interest");
const Decimal = require("decimal.js");

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
      interest_rate_type: {
        type: DataTypes.STRING,
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
      contract_interest_payment_of_year: {
        id: "contract_interest_payment_of_year",
        label: "Zinsauszahlung " + interestYear,
        class: "text-right",
        filter: "number",
        displayOnly: true,
      },
      contract_interest_payment_type: {
        id: "contract_interest_payment_type",
        label: "Zinsauszahlungsart",
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
      contract_last_transaction_date: {
        id: "contract_last_transaction_date",
        label: "Datum letzte Zahlung",
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
      contract_interest_rate_type: {
        id: "contract_interest_rate_type",
        label: "Zinsart",
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
    const interestPaymentsOfYear =
      contract.getInterestPaymentsOfYear(interestYear);
    const depositDate = contract.getDepositDate();
    const lastTransactionDate = contract.getLastTransactionDate();
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
        value: format.formatPercent(contract.interest_rate, 3),
        order: contract.interest_rate,
      },
      contract_interest_rate_type: {
        valueRaw: contract.getInterestRateType(),
        value: contract.getInterestRateType(),
        order: contract.interest_rate_type,
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
      contract_interest_payment_of_year: {
        valueRaw: interestPaymentsOfYear,
        value: format.formatMoney(interestPaymentsOfYear),
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
      contract_last_transaction_date: {
        valueRaw: lastTransactionDate ? lastTransactionDate : "",
        value: lastTransactionDate
          ? moment(lastTransactionDate).format("DD.MM.YYYY")
          : "",
        order: lastTransactionDate
          ? moment(lastTransactionDate).format("YYYY/MM/DD")
          : "",
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

  contract.prototype.isTerminated = function (toDate) {
    // check if all money was paid back until given date
    if (this.transactions.length <= 1) {
      return undefined;
    } else {
      this.sortTransactions();
      const lastTransaction = this.transactions[this.transactions.length - 1];
      return (lastTransaction.type === "termination" ||
        lastTransaction.type === "notreclaimed") &&
        moment(lastTransaction.transaction_date).isSameOrBefore(toDate)
        ? lastTransaction.transaction_date
        : undefined;
    }
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

  contract.prototype.getLastTransactionDate = function () {
    if (this.transactions.length) {
      return this.transactions[this.transactions.length - 1].transaction_date;
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

  contract.prototype.getInterestRateTypeValue = function () {
    const rateType =
      this.interest_rate_type ||
      settings.project.get("defaults.interest_rate_type") ||
      "money";
    return rateType;
  };

  contract.prototype.getInterestRateType = function () {
    const rateType =
      this.interest_rate_type ||
      settings.project.get("defaults.interest_rate_type") ||
      "money";
    if (rateType === "coupon") {
      return "Einkaufsgutschein";
    } else if (rateType === "money") {
      return "Geld";
    }
    return rateType;
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
      else if (a.type === "termination") return 1;
      else if (b.type === "termination") return -1;
      else if (a.type === "initial") return -1;
      else if (b.type === "initial") return 1;
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
    let toDate = moment(toDateParameter);
    const terminationDate = this.isTerminated(toDate);
    // if contract is terminated and the current transaction ID is not the termination transaction only calculate until termination date
    if (
      terminationDate &&
      this.transactions[this.transactions.length - 1].id !==
        currentTransactionId
    ) {
      toDate = moment(terminationDate);
    }
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
          begin: new Decimal(0),
          withdrawals: new Decimal(0),
          deposits: new Decimal(0),
          notReclaimed: new Decimal(0),
          interestPaid: new Decimal(0),
          interestBaseAmount: new Decimal(0), // to calculate with no compound methods
        },
      ];
      for (let year = firstYear; year <= lastYear; year++) {
        const currentYear = years[years.length - 1];
        var amount = new Decimal(currentYear.begin);
        var interestBaseAmount = currentYear.interestBaseAmount;
        // calculate interest for new transactions of year
        var interest = new Decimal(0);
        let terminationDate = undefined;
        this.getTransactionsOfYear(year).forEach((transaction) => {
          if (
            toDate.isSameOrAfter(transaction.transaction_date) &&
            currentTransactionId != transaction.id
          ) {
            amount = amount.plus(transaction.amount);
            if (method.compound || transaction.type !== "interestpayment") {
              interestBaseAmount = interestBaseAmount.plus(transaction.amount);
              if (amount <= 1) {
                terminationDate = moment(transaction.transaction_date);
                interestBaseAmount = new Decimal(0);
              } else {
                interest = interest.plus(
                  interestUtils.calculateInterestDaily(
                    moment(transaction.transaction_date),
                    year === lastYear ? toDate : undefined,
                    transaction.amount,
                    this.interest_rate,
                    this.interest_method
                  )
                );
              }
            }
            switch (transaction.type) {
              case "withdrawal":
              case "termination":
                currentYear.withdrawals = currentYear.withdrawals.plus(
                  transaction.amount
                );
                break;
              case "initial":
              case "deposit":
                currentYear.deposits = currentYear.deposits.plus(
                  transaction.amount
                );
                break;
              case "notreclaimed":
              case "notreclaimedpartial":
                currentYear.notReclaimed = currentYear.notReclaimed.plus(
                  transaction.amount
                );
                break;
              case "interestpayment":
                currentYear.interestPaid = currentYear.interestPaid.plus(
                  transaction.amount
                );
                break;
            }
          }
        });

        // calculate interest for existing balance
        if (year === lastYear || terminationDate) {
          interest = interest.plus(
            interestUtils.calculateInterestDaily(
              undefined,
              terminationDate || toDate,
              currentYear.interestBaseAmount,
              this.interest_rate,
              this.interest_method
            )
          );
        } else {
          interest = interest.plus(
            currentYear.interestBaseAmount
              .times(this.interest_rate)
              .dividedBy(100)
          );
        }
        currentYear.interest = new Decimal(interest.toFixed(2));
        currentYear.end = new Decimal(
          amount.plus(currentYear.interest).toFixed(2)
        );
        if (year !== lastYear) {
          years.push({
            year: year + 1,
            begin: new Decimal(currentYear.end),
            withdrawals: new Decimal(0),
            deposits: new Decimal(0),
            notReclaimed: new Decimal(0),
            interestPaid: new Decimal(0),
            interestBaseAmount: interestBaseAmount.plus(
              method.compound ? currentYear.interest : 0
            ),
          });
        } else if (
          terminationDate &&
          this.transactions[this.transactions.length - 1].id !==
            currentTransactionId &&
          currentYear.end !== 0
        ) {
          // if contract is terminated and there are small rounding numbers from the past correct interest to adjust to a zero end value
          currentYear.interest = currentYear.interest.minus(currentYear.end);
          currentYear.end = new Decimal(0);
        }
      }
      return years.map((year) => ({
        year: year.year,
        begin: year.begin.toNumber(),
        end: year.end.toNumber(),
        withdrawals: year.withdrawals.toNumber(),
        deposits: year.deposits.toNumber(),
        notReclaimed: year.notReclaimed.toNumber(),
        interestPaid: year.interestPaid.toNumber(),
        interestBaseAmount: year.interestBaseAmount.toNumber(),
        interest: year.interest.toNumber(),
      }));
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

  contract.prototype.getInterestPaymentsOfYear = function (year) {
    let sum = 0;
    this.transactions.forEach((transaction) => {
      if (
        transaction.type === "interestpayment" &&
        moment(transaction.transaction_date).year() == (year || moment().year())
      ) {
        sum += transaction.amount;
      }
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

  contract.prototype.deepDelete = function () {
    return Promise.all(
      this.transactions.map((transaction) =>
        transaction.destroy({
          trackOptions: utils.getTrackOptions(transaction, false),
        })
      )
    ).then(this.destroy({ trackOptions: utils.getTrackOptions(this, false) }));
  };

  contract.findFetchFull = function (models, whereClause) {
    return models.contract.findAll({
      where: whereClause,
      include: {
        model: models.transaction,
        as: "transactions",
      },
    });
  };

  contract.deepDelete = function (models, whereClause) {
    return contract
      .findFetchFull(models, whereClause)
      .then((contracts) =>
        Promise.all(contracts.map((contract) => contract.deepDelete()))
      );
  };

  return contract;
};
