  $(function () { $('.datepicker').datepicker({'format': 'dd.mm.yyyy', 'language': 'de'})});
  $(document).ready(function(){


    $('#termination_type_input').on('change', function() {
      $(".termination-type-group").addClass("hidden");
      $("#termination_type_"+$(this).val()).removeClass("hidden");
      $(".termination-type-input").attr('required', false);
      $(".termination-type-input-"+$(this).val()).attr('required', true);
    });

    $('#transaction_type').on('change', function() {
      var transactionsAmount = parseFloat($('#transaction_amount').attr('transactions-amount'));
      var amountToDate =Math.ceil(parseFloat($('#transaction_amount').attr('amount-to-date'))*100)/100;
      var contractAmount = parseFloat($('#transaction_amount').attr('contract-amount'));
      if ($(this).val() == 'initial' || $(this).val() == 'deposit') {
        $('#transaction_amount').attr('min', '0.01');
        $('#transaction_amount').attr('max', contractAmount-transactionsAmount);
      } else {
        $('#transaction_amount').attr('max', '-0.01');
        $('#transaction_amount').attr('min', '-'+amountToDate);
      }
    });

    $('#termination_type_input').change();
    $('#transaction_type').change();
        

     var dynamicColors = function() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return "rgb(" + r + "," + g + "," + b + ")";
     };

    var valuesSorted = (data) => {
      return Object.values(data).sort(function(a,b){return a-b})
    }

    var keysSorted = (data)  => {
      var sum = Object.values(data).reduce(function(a, b) { return a + b; }, 0);
      var labels = Object.keys(data).sort(function(a,b){return data[a]-data[b]})
      labels.forEach((label, index) => {
        var percentage = Math.round(data[label] / sum *10000) / 100;
        labels[index] = label + " ("+percentage +"%)";
      });
      return labels;
    }

    $('#by-relation').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/byrelation',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var ctx = $("#by-relation").get(0).getContext('2d');
              var colors = [];
              for (var i in data) {
                colors.push(dynamicColors());
             }
              var byRelationChart = new Chart(ctx,{
                  type: 'pie',
                  data: {
                    datasets: [{data: valuesSorted(data), backgroundColor: colors}],
                    labels: keysSorted(data)
                  }
              });              
            }
        }); 
    })


    $('#by-zip').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/byzip',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              console.log("resulst: " + result.responseText);
              console.log("values: " + JSON.stringify(Object.values(data)));
              var ctx = $("#by-zip").get(0).getContext('2d');
              var colors = [];
              for (var i in data) {
                colors.push(dynamicColors());
             }
              var byRelationChart = new Chart(ctx,{
                  type: 'pie',
                  data: {
                    datasets: [{data: valuesSorted(data), backgroundColor: colors}],
                    labels: keysSorted(data)
                  }
              });              
            }
        }); 
    })

    $('#by-month').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/bymonth',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var min = Math.min.apply(Math, Object.values(data));
              var max = Math.max.apply(Math, Object.values(data));
              var ctx = $("#by-month").get(0).getContext('2d');

              var byMonthChart = new Chart(ctx,{
                  type: 'line',
                  data: {
                    datasets: [{data: Object.values(data), backgroundColor: dynamicColors(), label: "Verschuldung"}],
                    labels: Object.keys(data)
                  },
                  options: {
                    responsive: true,
                    title: {
                      display: true,
                      text: 'Letzte 12 Monate'
                    },
                    scales: {
                      xAxes: [{
                        display: true,
                        scaleLabel: {
                          display: true,
                          labelString: 'Monat'
                        }
                      }],
                      yAxes: [{
                        display: true,
                        ticks: {
                          suggestedMin : min * 0.95,
                          suggestedMax : max * 1.05
                        },
                        scaleLabel: {
                          display: true,
                          labelString: 'Schuldenstand'
                        }
                      }]
                    }
                  }
              });              
            }
        }); 
    })

    $('#transactions-by-month').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/transactionsbymonth',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var dataCombined = Object.values(data.deposits).concat(Object.values(data.withdrawals)).concat(Object.values(data.interest));
              var min = Math.min.apply(Math, dataCombined);
              var max = Math.max.apply(Math, dataCombined);
              var ctx = $("#transactions-by-month").get(0).getContext('2d');

              var byMonthChart = new Chart(ctx,{
                  type: 'line',
                  data: {
                    datasets: [
                      {data: Object.values(data.deposits), borderColor: dynamicColors(), label: "Einzahlungen", steppedLine: false, fill: false}, 
                      {data: Object.values(data.withdrawals), borderColor: dynamicColors(), label: "Rückzahlungen", steppedLine: false, fill: false},
                      {data: Object.values(data.notReclaimed), borderColor: dynamicColors(), label: "Nicht Rückgefordert", steppedLine: false, fill: false},
                      {data: Object.values(data.interest), borderColor: dynamicColors(), label: "Zinsen", steppedLine: false, fill: false}],
                    labels: Object.keys(data.deposits)
                  },
                  options: {
                    responsive: true,
                    title: {
                      display: true,
                      text: 'Letzte 12 Monate'
                    },
                    scales: {
                      xAxes: [{
                        display: true,
                        scaleLabel: {
                          display: true,
                          labelString: 'Monat'
                        }
                      }],
                      yAxes: [{
                        display: true,
                        ticks: {
                          suggestedMin : 0,
                          suggestedMax : max * 1.05
                        },
                        scaleLabel: {
                          display: true,
                          labelString: 'Transaktionen'
                        }
                      }]
                    }
                  }
              });              
            }
        }); 
    })


    var dataTableLanguange = {
      "sEmptyTable":      "Keine Daten in der Tabelle vorhanden",
      "sInfo":            "_START_ bis _END_ von _TOTAL_ Einträgen",
      "sInfoEmpty":       "0 bis 0 von 0 Einträgen",
      "sInfoFiltered":    "(gefiltert von _MAX_ Einträgen)",
      "sInfoPostFix":     "",
      "sInfoThousands":   ".",
      "sLengthMenu":      "_MENU_ Einträge anzeigen",
      "sLoadingRecords":  "Wird geladen...",
      "sProcessing":      "Bitte warten...",
      "sSearch":          "Suchen",
      "sZeroRecords":     "Keine Einträge vorhanden.",
      "oPaginate": {
          "sFirst":       "Erste",
          "sPrevious":    "Zurück",
          "sNext":        "Nächste",
          "sLast":        "Letzte"
      },
      "oAria": {
          "sSortAscending":  ": aktivieren, um Spalte aufsteigend zu sortieren",
          "sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
      },
      select: {
              rows: {
              _: '%d Zeilen ausgewählt',
              0: 'Zum Auswählen auf eine Zeile klicken',
              1: '1 Zeile ausgewählt'
              }
      }
    }


    var table = $('#datatable').DataTable({
    	pageLength: 25,
      language: dataTableLanguange
    });
    table
    .column( '1:visible' )
    .order( 'asc' );
    

    $('[data-toggle="tooltip"]').tooltip(); 


    $(".alert-fadeout").fadeTo(5000, 500).slideUp(500, function(){
        $(".alert-fadeout").slideUp(500);
    });

    // confirm dialog on delete
    $('a.confirm').click(function() {

        var link = $(this).data('link');

        bootbox.confirm({
            message: $(this).data('confirmtext'),
            buttons: {
                confirm: {
                    label: 'Ja',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'Lieber nicht',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
               if (result) {
                    window.location.href = link;
               }
            }
        });
    });

    $('#root-container').removeClass('d-none');

    $('.datatable-buttons').each(function(index) {
      var forId = $(this).attr('for-id');
      $('#'+forId).prepend($(this).html());
    });

    var detailsTable = $('#details-table').DataTable({
      "paging":   false,
      "ordering": false,
      "info":     false,
      language: dataTableLanguange
    });

    $(document).on('click', 'td.details-control', function () {
        var tr = $(this).parent();
        var icon = $(this).children('span');
        var row = detailsTable.row( tr );        
        var details = tr.children('td.table-row-details').html();
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
            icon.removeClass('fa-minus-circle')
            icon.addClass('fa-plus-circle')
        }
        else {
            // Open this row
            row.child( details).show();
            //tr.next.children('table').DataTable();
            tr.addClass('shown');
            icon.removeClass('fa-plus-circle')
            icon.addClass('fa-minus-circle')
        }
    } );


  });


  
  