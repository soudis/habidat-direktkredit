/* jshint esversion: 8 */
const moment = require("moment");
const models = require("../models");

const chartColors = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928",
];

var generatePieChart = function (data, callback) {
  var chartData = [];
  var index = 0;
  for (var label in data) {
    var value = data[label];

    chartData.push({ value: value, color: chartColors[index], label: label });
    index++;
  }

  var Canvas = require("canvas"),
    canvas = new Canvas(800, 800),
    ctx = canvas.getContext("2d"),
    Chart = require("nchart"),
    fs = require("fs");

  new Chart(ctx).Pie(chartData);
  callback(canvas.toBuffer().toString("base64"));
};

exports.getYears = function (users) {
  var oldestPayment = moment("3000-01-01");
  users.forEach((user) => {
    user.contracts.forEach((contract) => {
      contract.transactions.forEach((transaction) => {
        if (oldestPayment.isAfter(transaction.transaction_date)) {
          oldestPayment = moment(transaction.transaction_date);
        }
      });
    });
  });
  var years = [];
  if (!oldestPayment.isSame("3000-01-01")) {
    for (var i = oldestPayment.year(); i <= moment().year(); i++) {
      years.push(i);
    }
  }
  return years;
};

exports.getNumbersPerYear = function () {
  return models.user.findFetchFull(models, {}).then((users) => {
    // pre calculate all contracts
    users.forEach((user) => {
      user.contracts.forEach((contract) => {
        contract.totals = contract.calculatePerYear();
      });
    });
    var years = exports.getYears(users);
    var rows = [];
    var prevRow;
    var aggregatedInterest = 0;
    years.forEach((year) => {
      var endOfYear = moment(year + "-12-31");
      var endOfLastYear = moment(year + "-12-31").subtract(1, "years");
      var interestDate = moment(year + "-12-31").add(1, "days");
      if (moment().year() === year) {
        interestDate = moment();
      }
      var row = {
        year: year,
        amountBegin: 0,
        amountEnd: 0,
        deposits: 0,
        withdrawals: 0,
        interestGained: 0,
        notReclaimed: 0,
        interestPaid: 0,
        newContracts: 0,
        newContractAvgInterestRate: 0,
        newContractAvgInterestRateWeighed: 0,
        newContractAmount: 0,
        terminatedContracts: 0,
        terminatedContractAvgInterestRate: 0,
        terminatedContractAvgInterestWeighed: 0,
        terminatedContractAmount: 0,
        runningContracts: 0,
        runningContractAvgInterestRate: 0,
        runningContractAvgInterestWeighed: 0,
        runningContractAmount: 0,
      };
      prevRow = prevRow || row;
      row.amountBegin = prevRow.amountEnd;
      //row.interestGained = -aggregatedInterest;
      users.forEach((user) => {
        user.contracts.forEach((contract) => {
          const yearTotals = contract.totals.find(
            (totals) => totals.year === year
          );
          if (yearTotals && contract.getDepositDate()) {
            row.deposits += yearTotals.deposits;
            row.withdrawals += yearTotals.withdrawals;
            row.interestPaid += yearTotals.interestPaid;
            row.notReclaimed += yearTotals.notReclaimed;
            row.interestGained += yearTotals.interest;
            if (
              contract.getDepositDate() &&
              contract.getDepositDate().year() === year
            ) {
              row.newContracts++;
              row.newContractAvgInterestRateWeighed +=
                yearTotals.end * contract.interest_rate;
              row.newContractAmount += yearTotals.end;
            }
            if (
              contract.isTerminated(endOfYear) &&
              !contract.isTerminated(endOfLastYear)
            ) {
              row.terminatedContracts++;
              row.terminatedContractAvgInterestWeighed +=
                yearTotals.begin * contract.interest_rate;
              row.terminatedContractAmount += yearTotals.begin;

              // calculated interest that was paid by termination withdrawal
              var transactionAmount = contract.getTransactionsAmount();
              if (transactionAmount < 0) {
                row.interestPaid += transactionAmount;
                row.withdrawals -= transactionAmount;
              }
            }
            if (!contract.isTerminated(endOfYear)) {
              row.runningContracts++;
              row.runningContractAvgInterestWeighed +=
                yearTotals.end * contract.interest_rate;
              row.runningContractAmount += yearTotals.end;
            }
          }
        });
      });
      row.amountEnd =
        row.amountBegin +
        row.deposits +
        row.withdrawals +
        row.interestGained +
        row.interestPaid +
        row.notReclaimed;
      if (row.newContractAmount > 0) {
        row.newContractAvgInterestRate =
          row.newContractAvgInterestRateWeighed / row.newContractAmount;
      }
      if (row.terminatedContractAmount > 0) {
        row.terminatedContractAvgInterestRate =
          row.terminatedContractAvgInterestWeighed /
          row.terminatedContractAmount;
      }

      if (row.runningContractAmount > 0) {
        row.runningContractAvgInterestRate =
          row.runningContractAvgInterestWeighed / row.runningContractAmount;
      }

      aggregatedInterest += row.interestGained;
      rows.push(row);
      prevRow = row;
    });
    if (rows.length > 0) {
      var totals = rows.reduce((a, b) => {
        return {
          year: "Gesamt",
          amountBegin: 0,
          amountEnd: b.amountEnd,
          deposits: a.deposits + b.deposits,
          withdrawals: a.withdrawals + b.withdrawals,
          interestGained: a.interestGained + b.interestGained,
          notReclaimed: a.notReclaimed + b.notReclaimed,
          interestPaid: a.interestPaid + b.interestPaid,
          newContracts: a.newContracts + b.newContracts,
          newContractAvgInterestRate: 0,
          newContractAvgInterestRateWeighed:
            a.newContractAvgInterestRateWeighed +
            b.newContractAvgInterestRateWeighed,
          newContractAmount: a.newContractAmount + b.newContractAmount,
          terminatedContracts: a.terminatedContracts + b.terminatedContracts,
          terminatedContractAvgInterestRate: 0,
          terminatedContractAvgInterestWeighed:
            a.terminatedContractAvgInterestWeighed +
            b.terminatedContractAvgInterestWeighed,
          terminatedContractAmount:
            a.terminatedContractAmount + b.terminatedContractAmount,
          runningContracts: b.runningContracts,
          runningContractAvgInterestWeighed:
            b.runningContractAvgInterestWeighed,
          runningContractAmount: b.runningContractAmount,
        };
      });
      if (totals.newContractAmount > 0) {
        totals.newContractAvgInterestRate =
          totals.newContractAvgInterestRateWeighed / totals.newContractAmount;
      }
      if (totals.terminatedContractAmount > 0) {
        totals.terminatedContractAvgInterestRate =
          totals.terminatedContractAvgInterestWeighed /
          totals.terminatedContractAmount;
      }
      if (totals.runningContractAmount > 0) {
        totals.runningContractAvgInterestRate =
          totals.runningContractAvgInterestWeighed /
          totals.runningContractAmount;
      }
      rows.push(totals);
    }
    return rows;
  });
};

exports.getGermanContractsByYearAndInterestRate = function (
  effectiveDate = undefined,
  interestRate = undefined,
  ignoreId = undefined
) {
  return models.user
    .findAll({
      where: { country: "DE" },
      include: {
        model: models.contract,
        as: "contracts",
      },
    })
    .then((users) => {
      // determine begin and end of ṕossible ranges
      var rangesBegin, rangesEnd;
      if (effectiveDate) {
        rangesBegin = moment(effectiveDate).subtract(1, "y").add(1, "days");
        rangesEnd = moment(effectiveDate).add(1, "y").subtract(1, "days");
      } else {
        rangesBegin = moment("3000-01-01");
        rangesEnd = moment("1900-01-01");
        users.forEach(function (user) {
          user.contracts.forEach(function (contract) {
            if (rangesBegin.isAfter(contract.sign_date)) {
              rangesBegin = moment(contract.sign_date);
            }
            if (rangesEnd.isBefore(contract.sign_date)) {
              rangesEnd = moment(contract.sign_date);
            }
          });
        });
      }

      if (rangesBegin.isSame(moment("1900-01-01"))) {
        return [];
      } else {
        // build all possible year ranges
        var ranges = [];
        for (
          var i = 0;
          i <=
          moment(rangesEnd)
            .add(1, "days")
            .subtract(1, "years")
            .diff(rangesBegin, "days");
          i++
        ) {
          ranges.push({
            startDate: moment(rangesBegin).add(i, "days"),
            endDate: moment(rangesBegin)
              .add(i, "days")
              .add(1, "years")
              .subtract(1, "days"),
          });
        }

        // loop over all contracts and assign them to all ranges and build result
        var result = [];
        var contractsPerInterest = {};
        users.forEach((user) => {
          user.contracts.forEach((contract) => {
            if (
              (!interestRate || contract.interest_rate == interestRate) &&
              (!ignoreId || ignoreId != contract.id)
            ) {
              contract.user = user;
              var signDate = moment(contract.sign_date);
              if (contractsPerInterest[contract.interest_rate.toString()]) {
                contractsPerInterest[contract.interest_rate.toString()]++;
              } else {
                contractsPerInterest[contract.interest_rate.toString()] = 1;
              }
              ranges.forEach((range) => {
                if (
                  signDate.isSameOrAfter(range.startDate) &&
                  signDate.isSameOrBefore(range.endDate)
                ) {
                  var entry = result.find((entry) => {
                    return (
                      entry.startDate.isSame(range.startDate) &&
                      entry.endDate.isSame(range.endDate) &&
                      entry.interestRate === contract.interest_rate
                    );
                  });
                  if (!entry) {
                    result.push({
                      startDate: range.startDate,
                      endDate: range.endDate,
                      interestRate: contract.interest_rate,
                      totalAmount: contract.amount,
                      contracts: [contract],
                      id: contract.id.toString(),
                    });
                  } else {
                    entry.totalAmount += contract.amount;
                    entry.contracts.push(contract);
                    entry.id = entry.id + "," + contract.id;
                  }
                }
              });
            }
          });
        });
        result.sort((a, b) => {
          if (a.id < b.id) {
            return -1;
          } else if (a.id > b.id) {
            return 1;
          } else {
            return a.startDate.diff(b.startDate, "days");
          }
        });

        // merge time ranges with same result
        var currentEntry;
        var resultMerged = [];
        result.forEach((entry) => {
          if (!currentEntry || currentEntry.id !== entry.id) {
            if (currentEntry) {
              resultMerged.push(currentEntry);
            }
            currentEntry = entry;
            currentEntry.contractsPerInterest =
              contractsPerInterest[currentEntry.interestRate];
            currentEntry.contracts.sort((a, b) => {
              return moment(a.sign_date).diff(b.sign_date);
            });
          }
          currentEntry.endDate = entry.endDate;
        });
        if (currentEntry) {
          resultMerged.push(currentEntry);
        }

        // sort ranges with largest total amount first
        resultMerged.sort((a, b) => {
          return b.totalAmount - a.totalAmount;
        });

        // if there is no result for a period but an interestrate is requested return number of total contracts for interest rate
        if (resultMerged.length === 0 && interestRate) {
          resultMerged.push({
            startDate: rangesBegin,
            endDate: rangesEnd,
            interestRate: parseFloat(interestRate),
            totalAmount: 0,
            contracts: [],
            contractsPerInterest: contractsPerInterest[interestRate] || 0,
          });
        }

        return resultMerged;
      }
    });
};

exports.getNumbers = function () {
  var contracts = {
    running: [],
    cancelled: [],
    notDeposited: [],
  };

  var userTotals = [];

  var numbers = {
    firstContractDate: moment(),
    total: {
      contractAmount: 0,
      avgContractAmount: 0,
      medianContractAmount: 0,
      contracts: 0,
      users: 0,
      avgRuntime: 0,
      avgContractAmountPerUser: 0,
      medianContractAmountPerUser: 0,
    },
    running: {
      contractAmount: 0,
      avgContractAmount: 0,
      medianContractAmount: 0,
      contracts: 0,
      users: 0,
      avgRuntime: 0,
    },
    cancelled: {
      contractAmount: 0,
      avgContractAmount: 0,
      medianContractAmount: 0,
      contracts: 0,
      users: 0,
      avgDaysToRepay: 0,
      avgDaysToRepayCount: 0,
      avgRuntime: 0,
    },
    notDeposited: {
      contractAmount: 0,
      avgContractAmount: 0,
      medianContractAmount: 0,
      contracts: 0,
      users: 0,
    },
  };
  var now = moment();

  return models.user.findFetchFull(models, {}).then((users) => {
    users.forEach((user) => {
      var hasNotTerminatedContracts = false;
      var hasTerminatedContracts = false;
      var hasDeposits = false;
      var userTotal = 0;
      user.contracts.forEach((contract) => {
        userTotal += contract.amount;
        if (contract.getDepositDate()) {
          hasDeposits = true;
          contract.sortTransactions();
          if (numbers.firstContractDate.isAfter(contract.sign_date)) {
            numbers.firstContractDate = moment(contract.sign_date);
          }
          if (contract.isTerminated(now)) {
            hasTerminatedContracts = true;
            numbers.cancelled.contracts++;
            numbers.cancelled.contractAmount += contract.amount;
            numbers.cancelled.avgRuntime += contract.getRuntime();
            contracts.cancelled.push(contract);
            if (
              contract.transactions.length > 0 &&
              contract.termination_date &&
              (!contract.termination_type || contract.termination_type === "T")
            ) {
              var daysToRepay = moment(
                contract.transactions[contract.transactions.length - 1]
                  .transaction_date
              ).diff(moment(contract.termination_date), "days");
              numbers.cancelled.avgDaysToRepay +=
                daysToRepay >= 0 ? daysToRepay : 0;
              numbers.cancelled.avgDaysToRepayCount += daysToRepay >= 0 ? 1 : 0;
            }
          } else {
            hasNotTerminatedContracts = true;
            numbers.running.contracts++;
            numbers.running.contractAmount += contract.amount;
            numbers.running.avgRuntime += contract.getRuntime();
            contracts.running.push(contract);
          }
        } else {
          // no deposits yet
          numbers.notDeposited.contracts++;
          numbers.notDeposited.contractAmount += contract.amount;
          contracts.notDeposited.push(contract);
        }
      });

      numbers.running.users += hasNotTerminatedContracts ? 1 : 0;
      numbers.cancelled.users +=
        hasTerminatedContracts && !hasNotTerminatedContracts ? 1 : 0;

      if (userTotal > 0) {
        userTotals.push(userTotal);
        numbers.notDeposited.users += hasDeposits ? 0 : 1;
      }
    });
    numbers.total.avgRuntime =
      numbers.cancelled.avgRuntime + numbers.running.avgRuntime;

    numbers.running.avgContractAmount =
      numbers.running.contractAmount / numbers.running.contracts;
    contracts.running.sort(function (a, b) {
      if (a.amount > b.amount) return 1;
      else if (b.amount > a.amount) return -1;
      else return 0;
    });
    if (contracts.running.length > 0) {
      numbers.running.medianContractAmount =
        contracts.running[Math.floor(contracts.running.length / 2)].amount;
    }
    numbers.running.avgRuntime =
      numbers.running.avgRuntime / numbers.running.contracts;

    numbers.cancelled.avgContractAmount =
      numbers.cancelled.contractAmount / numbers.cancelled.contracts;
    numbers.cancelled.avgDaysToRepay =
      numbers.cancelled.avgDaysToRepay / numbers.cancelled.avgDaysToRepayCount;
    contracts.cancelled.sort(function (a, b) {
      if (a.amount > b.amount) return 1;
      else if (b.amount > a.amount) return -1;
      else return 0;
    });
    if (contracts.cancelled.length > 0) {
      numbers.cancelled.medianContractAmount =
        contracts.cancelled[Math.floor(contracts.cancelled.length / 2)].amount;
    }
    numbers.cancelled.avgRuntime =
      numbers.cancelled.avgRuntime / numbers.cancelled.contracts;

    numbers.notDeposited.avgContractAmount =
      numbers.notDeposited.contractAmount / numbers.notDeposited.contracts;
    contracts.notDeposited.sort(function (a, b) {
      if (a.amount > b.amount) return 1;
      else if (b.amount > a.amount) return -1;
      else return 0;
    });
    if (contracts.notDeposited.length > 0) {
      numbers.notDeposited.medianContractAmount =
        contracts.notDeposited[
          Math.floor(contracts.notDeposited.length / 2)
        ].amount;
    }

    numbers.total.users =
      numbers.running.users +
      numbers.cancelled.users +
      numbers.notDeposited.users;
    numbers.total.contracts =
      numbers.running.contracts +
      numbers.cancelled.contracts +
      numbers.notDeposited.contracts;
    numbers.total.contractAmount =
      numbers.running.contractAmount +
      numbers.cancelled.contractAmount +
      numbers.notDeposited.contractAmount;
    numbers.total.avgContractAmount =
      numbers.total.contractAmount / numbers.total.contracts;
    contracts.total = contracts.running.concat(
      contracts.cancelled.concat(contracts.notDeposited)
    );
    contracts.total.sort(function (a, b) {
      if (a.amount > b.amount) return 1;
      else if (b.amount > a.amount) return -1;
      else return 0;
    });
    if (contracts.total.length > 0) {
      numbers.total.medianContractAmount =
        contracts.total[Math.floor(contracts.total.length / 2)].amount;
    }
    numbers.total.avgRuntime =
      numbers.total.avgRuntime /
      (numbers.running.contracts + numbers.cancelled.contracts);

    if (userTotals.length > 0)
      numbers.total.avgContractAmountPerUser =
        userTotals.reduce((a, b) => a + b, 0) / userTotals.length;

    userTotals.sort(function (a, b) {
      if (a.amount > b.amount) return 1;
      else if (b.amount > a.amount) return -1;
      else return 0;
    });
    if (userTotals.length > 0)
      numbers.total.medianContractAmountPerUser =
        userTotals[Math.floor(userTotals.length / 2)];

    return numbers;
  });
};
