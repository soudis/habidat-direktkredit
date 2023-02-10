/* jshint esversion: 8 */
$(document).ready(function () {
  var dynamicColors = function () {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgb(" + r + "," + g + "," + b + ")";
  };

  var valuesSorted = (data) => {
    return Object.values(data).sort(function (a, b) {
      return a - b;
    });
  };

  var keysSorted = (data) => {
    var labels = Object.keys(data).sort(function (a, b) {
      return data[a] - data[b];
    });
    return labels;
  };

  function loadChart(container, url, callback) {
    $.ajax({
      type: "get",
      dataType: "json",
      url: url,
      complete: function (result) {
        var data = JSON.parse(result.responseText);
        var ctx = $(container).get(0).getContext("2d");
        var colors = [];
        for (var i in data) {
          colors.push(dynamicColors());
        }
        var chart = new Chart(ctx, {
          type: "pie",
          data: {
            datasets: [{ data: valuesSorted(data), backgroundColor: colors }],
            labels: keysSorted(data),
          },
        });
        callback(chart);
      },
    });
  }

  var getSliderDateRange = function (sliderName) {
    var slider = $("#" + sliderName);
    var sliderValue = slider.data("slider").getValue();
    var begin = moment(slider.data("start"));
    var start = moment(begin).add(sliderValue[0], "months");
    var end = moment(begin).add(sliderValue[1], "months");
    var months = sliderValue[1] - sliderValue[0] + 1;
    return {
      start: start.format("DD.MM.YYYY"),
      end: end.format("DD.MM.YYYY"),
      months: months,
    };
  };

  var transactionsChart;
  var updateTransactionsByMonth = function () {
    var range = getSliderDateRange("transactionslider");
    $.ajax({
      type: "get",
      dataType: "json",
      url: _url(
        "/statistics/transactionsbymonth/" + range.start + "/" + range.end
      ),
      complete: function (result) {
        var data = JSON.parse(result.responseText);
        var dataCombined = Object.values(data.deposits)
          .concat(Object.values(data.withdrawals))
          .concat(Object.values(data.interest));
        var min = Math.min.apply(Math, dataCombined);
        var max = Math.max.apply(Math, dataCombined);
        var ctx = $("#transactions-by-month").get(0).getContext("2d");
        if (transactionsChart) {
          transactionsChart.destroy();
        }
        transactionsChart = new Chart(ctx, {
          type: "line",
          data: {
            datasets: [
              {
                data: Object.values(data.deposits),
                borderColor: dynamicColors(),
                label: "Einzahlungen",
                steppedLine: false,
                fill: false,
              },
              {
                data: Object.values(data.withdrawals),
                borderColor: dynamicColors(),
                label: "Rückzahlungen",
                steppedLine: false,
                fill: false,
              },
              {
                data: Object.values(data.notReclaimed),
                borderColor: dynamicColors(),
                label: "Nicht Rückgefordert",
                steppedLine: false,
                fill: false,
              },
              {
                data: Object.values(data.interest),
                borderColor: dynamicColors(),
                label: "Zinsen",
                steppedLine: false,
                fill: false,
              },
            ],
            labels: Object.keys(data.deposits),
          },
          options: {
            responsive: true,
            title: {
              display: false,
              text: range.months + " Monate",
            },
            scales: {
              xAxes: [
                {
                  display: true,
                  scaleLabel: {
                    display: true,
                    labelString: "Monat",
                  },
                },
              ],
              yAxes: [
                {
                  display: true,
                  ticks: {
                    suggestedMin: 0,
                    suggestedMax: max * 1.05,
                  },
                  scaleLabel: {
                    display: true,
                    labelString: "Transaktionen",
                  },
                },
              ],
            },
          },
        });
      },
    });
  };

  var byMonthChart;
  var updateDeptByMonth = function () {
    var range = getSliderDateRange("debtslider");
    $.ajax({
      type: "get",
      dataType: "json",
      url: _url("/statistics/bymonth/" + range.start + "/" + range.end),
      complete: function (result) {
        var data = JSON.parse(result.responseText);
        var min = Math.min.apply(Math, Object.values(data));
        var max = Math.max.apply(Math, Object.values(data));
        var ctx = $("#by-month").get(0).getContext("2d");
        if (byMonthChart) {
          byMonthChart.destroy();
        }
        byMonthChart = new Chart(ctx, {
          type: "line",
          data: {
            datasets: [
              {
                data: Object.values(data),
                backgroundColor: dynamicColors(),
                label: "Verschuldung",
              },
            ],
            labels: Object.keys(data),
          },
          options: {
            responsive: true,
            title: {
              display: false,
              text: range.months + " Monate",
            },
            scales: {
              xAxes: [
                {
                  display: true,
                  scaleLabel: {
                    display: true,
                    labelString: "Monat",
                  },
                },
              ],
              yAxes: [
                {
                  display: true,
                  ticks: {
                    suggestedMin: min * 0.95,
                    suggestedMax: max * 1.05,
                  },
                  scaleLabel: {
                    display: true,
                    labelString: "Schuldenstand",
                  },
                },
              ],
            },
          },
        });
      },
    });
  };

  var byRelationChart;
  var updateByRelationChart = function () {
    var range = getSliderDateRange("relationslider");
    if (byRelationChart) {
      byRelationChart.destroy();
    }
    loadChart(
      "#by-relation",
      _url("/statistics/byrelation/" + range.start + "/" + range.end),
      function (chart) {
        byRelationChart = chart;
      }
    );
  };

  var byRegionChart;
  var byRegionURL = _url("/statistics/byregion/country");
  var updateByRegionChart = function () {
    var range = getSliderDateRange("regionslider");
    if (byRegionChart) {
      byRegionChart.destroy();
    }
    loadChart(
      "#by-region",
      byRegionURL + "/" + range.start + "/" + range.end,
      function (chart) {
        byRegionChart = chart;
      }
    );
  };

  $("#by-region").click(function (evt) {
    var activePoints = byRegionChart.getElementsAtEvent(evt);
    if (activePoints && activePoints.length > 0) {
      var label = byRegionChart.data.labels[activePoints[0]._index];
      var description = "PLZ (" + label.split(" ")[0] + ")";
      $("#by-region-level").text(description);
      byRegionURL = _url("/statistics/byregion/zip-" + label.split(" ")[0]);
      var range = getSliderDateRange("regionslider");
      byRegionChart.destroy();
      $("#by-region-back").removeClass("d-none");
      var breadcrumbs = $("#by-region-back").data("breadcrumbs") || [];
      breadcrumbs.push({
        url: $("#by-region-back").data("currenturl"),
        description: $("#by-region-back").data("currentdescription"),
      });
      $("#by-region-back").data("breadcrumbs", breadcrumbs);
      $("#by-region-back").data("currenturl", byRegionURL);
      $("#by-region-back").data("currentdescription", description);

      loadChart(
        "#by-region",
        byRegionURL + "/" + range.start + "/" + range.end,
        function (chart) {
          byRegionChart = chart;
        }
      );
    }
  });

  $("#by-region-backbutton").click(function (evt) {
    var breadcrumbs = $("#by-region-back").data("breadcrumbs") || [];
    if (breadcrumbs.length > 0) {
      var breadcrumb = breadcrumbs.pop();
      $("#by-region-level").text(breadcrumb.description);
      $("#by-region-back").data("breadcrumbs", breadcrumbs);
      $("#by-region-back").data("current", breadcrumb.url);
      var range = getSliderDateRange("regionslider");
      byRegionChart.destroy();
      loadChart(
        "#by-region",
        breadcrumb.url + "/" + range.start + "/" + range.end,
        function (chart) {
          byRegionChart = chart;
        }
      );
    }
    if (breadcrumbs.length === 0) {
      $("#by-region-back").addClass("d-none");
    }
  });

  var updateFunctions = {
    relationslider: updateByRelationChart,
    regionslider: updateByRegionChart,
    debtslider: updateDeptByMonth,
    transactionslider: updateTransactionsByMonth,
  };

  var sliders = [
    "relationslider",
    "regionslider",
    "debtslider",
    "transactionslider",
  ];
  sliders.forEach(function (sliderName) {
    var slider = $("#" + sliderName);
    var sliderInfo = slider.parents(".chart-container").find(".slider-info");

    var updateSliderInfo = function (sliderValue) {
      var begin = moment(slider.data("start"));
      var startMonth = sliderValue[0];
      var endMonth = sliderValue[1];
      var start = moment(begin).add(startMonth, "months");
      var end = moment(begin).add(endMonth, "months");
      var dateFormat = "MMM Y";
      sliderInfo.text(
        start.format(dateFormat) +
          " - " +
          end.format(dateFormat) +
          " (" +
          (endMonth - startMonth + 1) +
          " Monate)"
      );
    };

    slider.on("slideStop", function (sliderValue) {
      updateFunctions[sliderName]();
    });
    slider.on("slide", function (sliderValue) {
      updateSliderInfo(sliderValue.value);
    });
    updateSliderInfo(slider.data("slider").getValue());
    updateFunctions[sliderName]();
  });

  var numberstable = $("#numberstable").DataTable({
    pageLength: 25,
    language: dataTableLanguange,
    order: [[0, "desc"]],
    responsive: {
      details: {
        type: "column",
      },
    },
  });
});
