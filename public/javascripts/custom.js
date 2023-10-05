/* jshint esversion: 8 */

var isDateSupported = function () {
  var input = document.createElement("input");
  var value = "a";
  input.setAttribute("type", "date");
  input.setAttribute("value", value);
  return input.value !== value;
};

var dataTableLanguange = {
  sEmptyTable: "Keine Daten in der Tabelle vorhanden",
  sInfo: "_START_ bis _END_ von _TOTAL_",
  sInfoEmpty: "0 bis 0 von 0",
  sInfoFiltered: "(gefiltert von _MAX_ Einträgen)",
  sInfoPostFix: "",
  sInfoThousands: ".",
  sLengthMenu: "_MENU_ Einträge",
  sLoadingRecords: "Wird geladen...",
  sProcessing: "Bitte warten...",
  lengthMenu:
    '<div class="input-group" id="datatable_pagelength"><span class="input-group-prepend"><span class="input-group-text fa fa-list-ol"></span></span><select class="custom-select form-control form-control-sm custom-select-sm">' +
    '<option value="10">10</option>' +
    '<option value="25">25</option>' +
    '<option value="50">50</option>' +
    '<option value="100">100</option>' +
    '<option value="-1">Alle</option>' +
    "</select></div>",
  search:
    '<div class="input-group"><span class="input-group-prepend"><span class="input-group-text fa fa-search"></span></span>',
  searchPlaceholder: "Suchen",
  sZeroRecords: "Keine Einträge vorhanden.",
  paginate: {
    first: "Erste",
    previous: '<span class="fa fa-arrow-left"></span>',
    next: '<span class="fa fa-arrow-right"></span>',
    last: "Letzte",
  },
  oAria: {
    sSortAscending: ": aktivieren, um Spalte aufsteigend zu sortieren",
    sSortDescending: ": aktivieren, um Spalte absteigend zu sortieren",
  },
  select: {
    rows: {
      _: "%d Zeilen ausgewählt",
      0: "Zum Auswählen auf eine Zeile klicken",
      1: "1 Zeile ausgewählt",
    },
  },
};

var projectId = "";

function _url(url) {
  var path = window.location.pathname;
  if (
    projectId &&
    projectId !== "" &&
    path.startsWith("/" + projectId) &&
    url.startsWith("/")
  ) {
    return "/" + projectId + url;
  } else {
    return url;
  }
}

moment.locale("de");
var detailsTable;

$(document).ready(function () {
  projectId = $("body").data("projectid");

  $(document).on("change", "#transaction_type", function (e) {
    var transactionsAmount = parseFloat(
      $("#transaction_amount").attr("transactions-amount")
    );
    var amountToDate =
      Math.ceil(
        parseFloat($("#transaction_amount").attr("amount-to-date")) * 100
      ) / 100;
    var contractAmount = parseFloat(
      $("#transaction_amount").attr("contract-amount")
    );
    if ($(this).val() == "initial" || $(this).val() == "deposit") {
      $("#transaction_amount").attr("min", "0.01");
      $("#transaction_amount").attr("max", contractAmount - transactionsAmount);
    } else {
      $("#transaction_amount").attr("max", "-0.01");
      $("#transaction_amount").attr(
        "min",
        (amountToDate > 0 ? "-" : "") + amountToDate
      );
    }
  });

  $(document).on("change", "input[type=radio][name=type]", function (e) {
    $(".radio-inputs").addClass("d-none");
    $(".radio-inputs input").prop("required", false);
    $("#" + this.value + "_inputs").removeClass("d-none");
    if (this.value === "person") {
      $("#first_name").prop("required", true);
      $("#last_name").prop("required", true);
    } else if (this.value === "organisation") {
      $("#organisation_name").prop("required", true);
    }
  });

  $(document).on("change", "#transaction_date", function (e) {
    var transactionDate = $("#transaction_date").val();
    var contractId = $("#transaction_contract_id").val();
    var transactionId = -1;
    if ($("#transaction_id").length > 0) {
      transactionId = $("#transaction_id").val();
    }
    $.get(
      _url(
        "/contract/amount_to_date/" +
          contractId +
          "/" +
          transactionId +
          "/" +
          transactionDate
      ),
      function (data) {
        $("#transaction_amount").attr("amount-to-date", data.amountToDate);
        $("#transaction_type").change();
      },
      "json"
    );
  });

  $(document).on("change", ".custom-file-input", function (e) {
    //get the file name
    var fileName = $(this).val().split("\\").pop();
    //replace the "Choose a file" label
    $(this).next(".custom-file-label").html(fileName);
  });

  $('[data-toggle="tooltip"]').tooltip();

  $(".alert-fadeout")
    .fadeTo(5000, 500)
    .slideUp(500, function () {
      $(".alert-fadeout").slideUp(500);
    });

  detailsTable = $("#details-table").DataTable({
    language: dataTableLanguange,
    order: [[5, "desc"]],
  });

  $("#details-table").removeClass("d-none");
  $(".details-table-buttons")
    .children()
    .each(function (index) {
      var forId = $(this).parent().attr("for-id");
      $(this)
        .detach()
        .prependTo($("#" + forId));
    });
  $("#datatable_pagelength")
    .parent()
    .detach()
    .prependTo($("#details-table_filter"));
  $("#details-table_filter")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-6")
    .addClass("col-sm-5");
  $("#details-table_length")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-6")
    .addClass("col-sm-7");
  $("#details-table_info")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-5")
    .addClass("col-sm-5");
  $("#details-table_paginate")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-7")
    .addClass("col-sm-7");

  $(document).on("click", "td.details-control", function () {
    var tr = $(this).parent();
    var icon = $(this).children("span");
    var row = detailsTable.row(tr);
    var details = tr.children("td.table-row-details").html();
    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass("shown");
      icon.removeClass("fa-minus-circle");
      icon.addClass("fa-plus-circle");
    } else {
      // Open this row
      row.child(details).show();
      //tr.next.children('table').DataTable();
      tr.addClass("shown");
      icon.removeClass("fa-plus-circle");
      icon.addClass("fa-minus-circle");
    }
  });

  $(document).on("keydown", "#sidebar :input:not(textarea)", function (event) {
    if (event.key == "Enter") {
      event.preventDefault();
    }
  });

  if (!isDateSupported()) {
    $(".alt-datepicker").datepicker({ format: "yyyy-mm-dd", language: "de" });
  }
});
