/* jshint esversion: 8 */
$(document).ready(function () {
  var orderBy = 1;
  if ($("#datatable").hasClass("selectable")) {
    orderBy = 2;
  }
  table = $("#datatable").DataTable({
    pageLength: 25,
    language: dataTableLanguange,
    order: [[orderBy, "desc"]],
    responsive: {
      details: {
        type: "column",
      },
    },
    initComplete: function (settings, json) {},
  });

  function toggleFilters(update = false) {
    if (
      ($("#datatable thead tr:eq(1)").length && !update) ||
      (!$("#datatable thead tr:eq(1)").length && update)
    ) {
      $(".toggle-filters")
        .children("span")
        .removeClass("fa-search-minus")
        .addClass("fa-search-plus");
      $("#datatable thead tr:eq(1)").remove();
      table.columns().search("").draw();
    } else {
      if (update) {
        $("#datatable thead tr:eq(1)").remove();
      }
      $(".toggle-filters")
        .children("span")
        .removeClass("fa-search-plus")
        .addClass("fa-search-minus");
      $("#datatable thead tr").clone(true).appendTo("#datatable thead");
      $("#datatable thead tr:eq(1) th:visible").each(function (i) {
        if ($(this).data("filter")) {
          var filterType = $(this).data("filter");
          var filterOptions = $(this).data("filter-options");
          var name = $(this).data("name");
          var title = $(this).text();
          if (filterType === "text") {
            $(this).replaceWith(
              "<th data-filter=" +
                filterType +
                ' data-name="' +
                name +
                '"><div class="input-group input-group-sm"><div class="input-group-prepend"><span class="input-group-text"><spand class="fa fa-search"></span></span></div><input class="text-filter form-control form-control-sm" data-name="' +
                name +
                '" type="text" placeholder="' +
                title +
                '" /></div></th>'
            );
          } else if (filterType === "date") {
            $(this).replaceWith(
              "<th data-filter=" +
                filterType +
                ' data-name="' +
                name +
                '"><div class="input-group input-group-sm"><div class="input-group-prepend"><select class="custom-select-sm custom-select date-filter-operator"><option selected value="=">=</option><option value="<">&lt;</option><option value="<=">≤</option><option value=">">&gt;</option><option value=">=">≥</option></div></select></div><input class="form-control form-control-sm date-filter" data-name="' +
                name +
                '" type="date" placeholder="' +
                title +
                '" /></div></th>'
            );
          } else if (filterType === "number") {
            $(this).replaceWith(
              "<th data-filter=" +
                filterType +
                ' data-name="' +
                name +
                '"><div class="input-group input-group-sm"><div class="input-group-prepend"><select class="custom-select-sm custom-select number-filter-operator"><option selected value="=">=</option><option value="<">&lt;</option><option value="<=">≤</option><option value=">">&gt;</option><option value=">=">≥</option></div></select></div><input class="form-control form-control-sm number-filter" data-name="' +
                name +
                '" type="number" placeholder="' +
                title +
                '" /></div></th>'
            );
          } else if (filterType === "list") {
            var options = "<option selected>Alle</option>";
            filterOptions.forEach((option) => {
              options += "<option>" + option + "</option>";
            });
            $(this).replaceWith(
              "<th data-filter=" +
                filterType +
                ' data-name="' +
                name +
                '"><div class="input-group input-group-sm"><select class="custom-select custom-select-sm list-filter " data-name="' +
                name +
                '">' +
                options +
                "</select></div></th>"
            );
          }
        } else {
          $(this).replaceWith("<th></th>");
        }
      });
    }
  }

  $("#column_select").multiselect({
    buttonClass: "btn btn-light",
    enableHTML: true,
    maxHeight: 500,
    buttonText: function (options, select) {
      return '<span class="fa fa-columns "></span>';
    },
    onChange: function (option, checked, select) {
      table.column($(option).val() + ":name").visible(checked);
      toggleFilters(true);
    },
  });
  $(".datatable-buttons")
    .children()
    .each(function (index) {
      var forId = $(this).parent().attr("for-id");
      $(this)
        .detach()
        .prependTo($("#" + forId));
    });
  $("#datatable_parent").removeClass("d-none");
  table.responsive.recalc();
  $("#datatable_pagelength")
    .parent()
    .detach()
    .prependTo($("#datatable_filter"));
  $("#datatable_filter")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-6")
    .addClass("col-sm-4");
  $("#datatable_length")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-6")
    .addClass("col-sm-8");
  $("#datatable_info")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-5")
    .addClass("col-sm-5");
  $("#datatable_paginate")
    .parent()
    .removeClass("col-sm-12")
    .removeClass("col-md-7")
    .addClass("col-sm-7");

  $(document).on("click", ".toggle-filters", function () {
    toggleFilters(false);
  });

  $(document).on("keyup change", ".text-filter", function () {
    var name = $(this).data("name");
    if (table.column(name + ":name").search() !== this.value) {
      table.column(name + ":name").search(this.value);
      updateCustomFilters();
    }
  });

  $(document).on("change", ".list-filter", function () {
    var name = $(this).data("name");
    if (table.column(name + ":name").search() !== this.value) {
      table
        .column(name + ":name")
        .search(this.value !== "Alle" ? this.value : "");
      updateCustomFilters();
    }
  });

  function popCustomFilters(count) {
    for (var i = 0; i < count; i++) {
      $.fn.dataTable.ext.search.pop();
    }
  }

  var orderTriggerDisabled = false;
  $("#datatable").on("order.dt", function () {
    // This will show: "Ordering on column 1 (asc)", for example
    if (!orderTriggerDisabled) {
      updateCustomFilters();
    }
  });

  function reDrawTable() {
    orderTriggerDisabled = true;
    table.draw();
    orderTriggerDisabled = false;
  }

  function updateCustomFilters(pop = true) {
    var customFilterCount = 0;
    $("#datatable thead tr:eq(1) th:visible").each(function (i) {
      var filterType = $(this).data("filter");
      var name = $(this).data("name");
      if (filterType === "date") {
        var element = $(this).find("input.date-filter");
        name = element.data("name");
        var searchValueText = element.val();
        var searchValue = moment(element.val());
        var operator = element.prev().children("select").val();
        var colIndex = table.column(name + ":name").index(false);
        customFilterCount++;
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
          var val = moment(data[colIndex], "DD.MM.YYYY");

          if (searchValueText == "") {
            return true;
          } else if (operator === "=") {
            return searchValue.isSame(val);
          } else if (operator === "<") {
            return searchValue.isAfter(val);
          } else if (operator === "<=") {
            return searchValue.isSameOrAfter(val);
          } else if (operator === ">") {
            return searchValue.isBefore(val);
          } else if (operator === ">=") {
            return searchValue.isSameOrBefore(val);
          } else {
            return true;
          }
        });
      } else if (filterType === "number") {
        var element = $(this).find("input.number-filter");
        name = element.data("name");
        var searchValue = element.val();
        var operator = element.prev().children("select").val();
        var colIndex = table.column(name + ":name").index(false);
        customFilterCount++;
        $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
          var val = parseInt(
            data[colIndex].split(".").join("").split(",").join(".")
          );
          if (searchValue == "") {
            return true;
          } else if (operator === "=") {
            return searchValue == val;
          } else if (operator === "<") {
            return searchValue > val;
          } else if (operator === "<=") {
            return searchValue >= val;
          } else if (operator === ">") {
            return searchValue < val;
          } else if (operator === ">=") {
            return searchValue <= val;
          } else {
            return true;
          }
        });
      }
    });
    if (pop) {
      reDrawTable();
      popCustomFilters(customFilterCount);
    }
    return customFilterCount;
  }

  $(document).on("change keyup", "#datatable_filter input", function () {
    updateCustomFilters();
  });

  $(document).on("keyup change", ".date-filter", function () {
    updateCustomFilters();
  });

  $(document).on("change", ".date-filter-operator", function () {
    $(this).parent().next().change();
  });

  $(document).on("keyup change", ".number-filter", function () {
    updateCustomFilters();
  });

  $(document).on("change", ".number-filter-operator", function () {
    $(this).parent().next().change();
  });

  function getCurrentView() {
    var view = {
      columnsSelected: $("#column_select").val(),
      tableSearch: table.search(),
      pageLength: $("#datatable_pagelength select").val(),
      order: table.order(),
      columnFilters: [],
      columnFiltersEnabled: false,
    };
    $("#datatable thead tr:eq(1) th:visible").each(function (i) {
      view.columnFiltersEnabled = true;
      var filterType = $(this).data("filter");
      var name = $(this).data("name");
      if (
        filterType === "text" &&
        $(this).find("input.text-filter").val() != ""
      ) {
        view.columnFilters.push({
          name: name,
          type: filterType,
          value: $(this).find("input.text-filter").val(),
        });
      } else if (
        filterType === "date" &&
        $(this).find("input.date-filter").val() != ""
      ) {
        view.columnFilters.push({
          name: name,
          type: filterType,
          value: $(this).find("input.date-filter").val(),
          operator: $(this).find("select.date-filter-operator").val(),
        });
      } else if (
        filterType === "number" &&
        $(this).find("input.number-filter").val() != ""
      ) {
        view.columnFilters.push({
          name: name,
          type: filterType,
          value: $(this).find("input.number-filter").val(),
          operator: $(this).find("select.number-filter-operator").val(),
        });
      } else if (
        filterType === "list" &&
        $(this).children("select.list-filter").val() != ""
      ) {
        view.columnFilters.push({
          name: name,
          type: filterType,
          value: $(this).find("select.list-filter").val(),
        });
      }
    });
    return view;
  }

  function setColumnsSelected(columnsSelected) {
    $("#column_select")
      .val()
      .forEach((column) => {
        table.column(column + ":name").visible(false);
      });
    $("#column_select").multiselect("deselectAll", false);
    columnsSelected.forEach((column) => {
      $("#column_select").multiselect("select", column);
      table.column(column + ":name").visible(true);
    });
  }

  function restoreView(view) {
    table.search("").columns().search("");

    if (view.tableSearch) {
      table.search(view.tableSearch);
    }
    if (view.pageLength) {
      $("#datatable_pagelength select").val(view.pageLength);
    }
    if (view.columnsSelected) {
      setColumnsSelected(view.columnsSelected);
      reDrawTable();
    }
    var customFilterCount = 0;
    if (view.columnFiltersEnabled) {
      if (!$("#datatable thead tr:eq(1) th:visible").length) {
        toggleFilters();
      } else {
        toggleFilters(true);
      }
      reDrawTable();

      $("#datatable thead tr:eq(1) th:visible").each(function (i) {
        var filterType = $(this).data("filter");
        var name = $(this).data("name");
        var columnFilter = view.columnFilters.find((filter) => {
          return filter.name === name;
        });
        if (columnFilter) {
          if (filterType === "text" && columnFilter.value != "") {
            $(this).find("input.text-filter").val(columnFilter.value);
            $(this).find("input.text-filter").change();
          } else if (filterType === "date" && columnFilter.value != "") {
            $(this).find("input.date-filter").val(columnFilter.value);
            $(this)
              .find("select.date-filter-operator")
              .val(columnFilter.operator);
          } else if (filterType === "number" && columnFilter.value != "") {
            $(this).find("input.number-filter").val(columnFilter.value);
            $(this)
              .find("select.number-filter-operator")
              .val(columnFilter.operator);
          } else if (filterType === "list" && columnFilter.value != "") {
            $(this).find("select.list-filter").val(columnFilter.value);
            $(this).find("select.list-filter").change();
          }
        }
      });
      customFilterCount = updateCustomFilters(false);
    } else {
      if ($("#datatable thead tr:eq(1) th:visible").length) {
        toggleFilters();
      }
    }
    if (view.order) {
      orderTriggerDisabled = true;
      table.order(view.order);
      orderTriggerDisabled = false;
    }
    reDrawTable();
    popCustomFilters(customFilterCount);
  }

  function saveView(view, id = undefined) {
    $.ajax({
      url: _url("/user/saveview" + (id !== undefined ? "/" + id : "")),
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ view: view }),
      success: function (response) {
        var views = $("#saved_views").data("views");
        if (id !== undefined) {
          views.splice(id, 1, view);
          $("#saved_views").data("views", views);
        } else {
          views.push(view);
          $("#saved_views").data("views", views);
          $("#saved_views").append(
            $("<option>", {
              text: view.name,
              value: response.id,
            })
          );
        }
        $("#saved_views").val(response.id);
        bootbox.alert("Ansicht " + view.name + " gespeichert!");
      },
      error: function (xhr, status, error) {
        var data = JSON.parse(xhr.responseText);
        errorAlert(data.error);
      },
    });
  }

  $(document).on("click", ".create-view", function () {
    bootbox.prompt({
      size: "small",
      placeholder: "Name der Ansicht",
      title: "Ansicht speichern",
      callback: function (result) {
        if (result) {
          var view = getCurrentView();
          view.name = result;
          saveView(view);
        }
      },
      buttons: {
        confirm: {
          label: "Speichern",
          className: "btn-success",
        },
        cancel: {
          label: "Abbrechen",
          className: "btn-danger",
        },
      },
    });
  });

  $(document).on("click", ".save-view", function () {
    var view = getCurrentView();
    var id = $("#saved_views").val();
    if (id === "default") {
      errorAlert("Standardansicht kann nicht überschrieben werden");
    } else {
      id = parseInt(id);
      var views = $("#saved_views").data("views");
      view.name = views[id].name;
      saveView(view, id);
    }
  });

  $(document).on("click", ".delete-view", function () {
    var id = $("#saved_views").val();
    if (id === "default") {
      errorAlert("Standardansicht kann nicht gelöscht werden");
    } else {
      id = parseInt(id);
      var views = $("#saved_views").data("views");
      view = views[id];
      $.ajax({
        url: _url("/user/deleteview/" + id),
        type: "GET",
        contentType: "application/json",
        success: function (response) {
          var views = $("#saved_views").data("views");
          views.splice(id, 1);
          var index = id;
          $("#saved_views option:eq(" + (id + 1) + ")")
            .nextAll()
            .each(function (i) {
              $(this).replaceWith(
                $("<option>", {
                  text: views[index].name,
                  value: index,
                })
              );
              index++;
            });

          $("#saved_views option:eq(" + (id + 1) + ")").remove();
          $("#saved_views").data("views", views);
          $("#saved_views").val("default");
          bootbox.alert("Ansicht " + view.name + " gelöscht!");
        },
        error: function (xhr, status, error) {
          var data = JSON.parse(xhr.responseText);
          errorAlert(data.error);
        },
      });
    }
  });

  $("#saved_views").data("default", getCurrentView());
  $(document).on("change", "#saved_views", function () {
    var views = $("#saved_views").data("views");
    var id = $(this).val();
    var view;
    if (id === "default") {
      view = $("#saved_views").data("default");
    } else {
      view = views[id];
    }
    if (!view) {
      table.search("").columns().search("").draw();
    } else {
      restoreView(view);
    }
  });

  $(document).on("click", ".export-data", function () {
    var interest_year = $("#datatable").data("interest-year");
    var fields = $("#column_select").val();
    var users = [];
    table
      .column("user_id:name", { search: "applied" })
      .data()
      .each((value) => users.push(value));
    var contracts = [];
    table
      .column("contract_id:name", { search: "applied" })
      .data()
      .each((value) => contracts.push(value));
    if (table.rows(".selected").data() === 0) {
      errorAlert("Keine Einträge ausgewählt");
      return false;
    }
    const contractIdIndex = table.column("contract_id:name").index();
    if ($("#datatable").hasClass("selectable")) {
      var selected = [];
      $.each(table.rows(".selected").data(), function () {
        selected.push(this[contractIdIndex].display);
      });
      contracts = contracts.filter((contract) => {
        return selected.includes(contract);
      });
      selected = [];
      const userIdIndex = table.column("user_id:name").index();
      $.each(table.rows(".selected").data(), function () {
        selected.push(this[userIdIndex].display);
      });
      users = users.filter((users) => {
        return selected.includes(users);
      });
    }
    var action = _url("/user/export");
    $('<form action="' + action + '" method="POST"></form>')
      .append('<input name="fields" value="' + fields + '" />')
      .append('<input name="users" value="' + users + '" />')
      .append(
        interest_year
          ? '<input name="interest_year" value="' + interest_year + '" />'
          : ""
      )
      .append('<input name="contracts" value="' + contracts + '" />')
      .appendTo("body")
      .submit()
      .remove();
  });

  $(document).on("click", ".bulk-delete", function () {
    var target = $(this).data("target");
    bootbox.confirm({
      message: "Ausgewählte Datensätze löschen?",
      buttons: {
        confirm: {
          label: "Ja",
          className: "btn-success",
        },
        cancel: {
          label: "Lieber nicht",
          className: "btn-danger",
        },
      },
      callback: function (result) {
        if (result) {
          var ids = [];
          $.each(table.rows(".selected").data(), function () {
            ids.push(this[table.column(target + "_id:name").index()].display);
          });
          if (ids.length === 0) {
            bootbox.alert("Keine Zeilen ausgewählt");
          } else {
            $.post(_url("/" + target + "/bulkdelete"), {
              ids: JSON.stringify(ids),
            }).done((response) => {
              if (response.error) {
                bootbox.alert(response.error);
              } else {
                table.rows(".selected").remove().draw();
              }
            });
          }
        }
      },
    });
  });

  var updateSelected = function () {
    var contracts = [];
    $.each(table.rows(".selected").data(), function () {
      contracts.push(this[table.column("contract_id:name").index()].display);
    });
    $("#process_interest_payment").data(
      "parameters",
      encodeURIComponent(contracts.join(","))
    );
  };

  $(document).on("change", "#interest_year", function () {
    $(location).attr("href", _url("/process/interestpayment/" + $(this).val()));
  });

  $(document).on("click", "#datatable.selectable td.selectable", function () {
    $(this).parent().toggleClass("selected");
    $(this).parent().find("td.selector span").toggleClass("d-none");
    updateSelected();
  });

  $(document).on("click", "#datatable.selectable th.selector", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $(this).children("span.selected").addClass("d-none");
      $(this).children("span.not-selected").removeClass("d-none");
      $(this).parents("table").find("tbody tr").removeClass("selected");
      $(this)
        .parents("table")
        .find("tbody td.selector span.selected")
        .addClass("d-none");
      $(this)
        .parents("table")
        .find("tbody td.selector span.not-selected")
        .removeClass("d-none");
    } else {
      $(this).addClass("selected");
      $(this).children("span.selected").removeClass("d-none");
      $(this).children("span.not-selected").addClass("d-none");
      $(this).parents("table").find("tbody tr").addClass("selected");
      $(this)
        .parents("table")
        .find("tbody td.selector span.selected")
        .removeClass("d-none");
      $(this)
        .parents("table")
        .find("tbody td.selector span.not-selected")
        .addClass("d-none");
    }
    updateSelected();
  });
});
