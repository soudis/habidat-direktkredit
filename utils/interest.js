const settings = require("./settings");
const moment = require("moment");
const Decimal = require("decimal.js");

exports.splitMethod = function (method) {
  var methodString =
    method ||
    settings.project.get("defaults.interest_method") ||
    "365_compound";
  return {
    daily: methodString.split("_")[0],
    compound: methodString.split("_")[1] === "compound",
  };
};

exports.getBaseDays = function (method, date) {
  if (method.daily === "ACT") {
    return moment(date).endOf("year").dayOfYear();
  } else if (method.daily === "30E360") {
    return 360;
  } else {
    return parseInt(method.daily);
  }
};

exports.calculateInterestDaily = function (
  fromDateParameter,
  toDateParameter,
  amount,
  rate,
  methodString
) {
  const method = exports.splitMethod(methodString);
  const fromDate = fromDateParameter
    ? moment(fromDateParameter)
    : moment(toDateParameter).startOf("year");
  const toDate = toDateParameter
    ? moment(toDateParameter)
    : moment(fromDateParameter).endOf("year");
  const firstYear = !toDateParameter;
  const lastYear = !fromDateParameter;
  var interestDays = 0;
  if (method.daily === "30E360") {
    if (toDate.isSameOrBefore(moment(fromDate).endOf("month"))) {
      // if the dates are in the same month
      interestDays = moment(toDate).diff(fromDate, "days");
    } else {
      // days in first month
      interestDays = Math.max(30 - fromDate.date() + 1, 0);
      // months * 30
      var months = moment(toDate).month() - fromDate.month() - 1;
      interestDays += months * 30;
      // days in last month
      interestDays += Math.min(moment(toDate).date(), 30);
      interestDays -= lastYear ? 1 : 0;
      interestDays -= !lastYear && !firstYear ? 1 : 0;
    }
  } else {
    interestDays = Math.max(toDate.diff(fromDate, "days"), 0);
  }
  return new Decimal(amount)
    .times(rate)
    .dividedBy(100)
    .times(interestDays)
    .dividedBy(exports.getBaseDays(method, toDate));
};
