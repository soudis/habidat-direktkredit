
  $(document).ready(function(){

    $(document).on("change", '#transaction_type', function(e) {
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

    $(document).on("change", '#transaction_date', function(e) {
      var transactionDate = $('#transaction_date').val();
      var contractId = $('#transaction_contract_id').val();
      var transactionId = -1;
      if ($('#transaction_id').length > 0) {
        transactionId = $('#transaction_id').val();
      }
      $.get('/contract/amount_to_date/'+contractId+'/' + transactionId + '/' +transactionDate, function( data ) {       
        $('#transaction_amount').attr('amount_to_date', data.amountToDate);    
      }, 'json');
      $('transaction_type').change();
    });       

    $(document).on("change", '.custom-file-input', function(e) {
        //get the file name
        var fileName = $(this).val().split('\\').pop();
        //replace the "Choose a file" label
        $(this).next('.custom-file-label').html(fileName);
    })


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
      var labels = Object.keys(data).sort(function(a,b){return data[a]-data[b]})
      return labels;
    }

    function loadChart(container, url, callback) {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: url,
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var ctx = $(container).get(0).getContext('2d');
              var colors = [];
              for (var i in data) {
                colors.push(dynamicColors());
              }
              var chart = new Chart(ctx,{
                  type: 'pie',
                  data: {
                    datasets: [{data: valuesSorted(data), backgroundColor: colors}],
                    labels: keysSorted(data)
                  }
              }); 
              callback(chart);
            }
        });     	
    }    

    var byRelationChart;
    $('#by-relation').each(() => {
    	loadChart('#by-relation', '/statistics/byrelation', function(chart) {
    		byRelationChart = chart;
    	})
    })
 	
 	var byRegionChart;
    $('#by-region').each(function () {
    	loadChart('#by-region', '/statistics/byregion/country', function(chart) {
    		byRegionChart = chart;
    	})
    })

	$("#by-region").click( 
	    function(evt){
	        var activePoints = byRegionChart.getElementsAtEvent(evt);
	        if (activePoints && activePoints.length > 0 ) {
	        	byRegionChart.destroy();
				var label = byRegionChart.data.labels[activePoints[0]._index];
				$('#by-region-level').text('PLZ (' + label.split(' ')[0] + ')')
		        var url = '/statistics/byregion/zip-' + label.split(' ')[0];
		    	loadChart('#by-region', url, function(chart) {
		    		byRegionChart = chart;
		    	})
	        }	        
	    }
	);     

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
      "sInfo":            "_START_ bis _END_ von _TOTAL_",
      "sInfoEmpty":       "0 bis 0 von 0",
      "sInfoFiltered":    "(gefiltert von _MAX_ Einträgen)",
      "sInfoPostFix":     "",
      "sInfoThousands":   ".",
      "sLengthMenu":      "_MENU_ Einträge",
      "sLoadingRecords":  "Wird geladen...",
      "sProcessing":      "Bitte warten...",
      "lengthMenu": '<div class="input-group" id="datatable_pagelength"><span class="input-group-prepend"><span class="input-group-text fa fa-list-ol"></span></span><select class="custom-select form-control form-control-sm custom-select-sm">'+
            '<option value="10">10</option>'+
            '<option value="25">25</option>'+
            '<option value="50">50</option>'+
            '<option value="100">100</option>'+
            '<option value="-1">Alle</option>'+
            '</select></div>',
      "search": '<div class="input-group"><span class="input-group-prepend"><span class="input-group-text fa fa-search"></span></span>',
      "searchPlaceholder": "Suchen",
      "sZeroRecords":     "Keine Einträge vorhanden.",
      "paginate": {
          "first":       "Erste",
          "previous":    '<span class="fa fa-arrow-left"></span>',
          "next":        '<span class="fa fa-arrow-right"></span>',
          "last":        "Letzte"
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


    table = $('#datatable').DataTable({
    	pageLength: 25,
      language: dataTableLanguange,
      order: [[ 1, 'desc' ]],      
      responsive: {
        details: {
          type: "column"
        }
      },
      initComplete: function(settings, json) {       
        

      }      
    });

    $('#column_select').multiselect({
        buttonClass: 'btn btn-light',
        enableHTML: true,
        buttonText: function(options, select) {
            return '<span class="fa fa-columns "></span>';
        },
        onChange: function(option, checked, select) {
            table.column($(option).val()+':name').visible(checked);
        }            
    });          
    $('.datatable-buttons').children().each(function(index) {
      var forId = $(this).parent().attr('for-id');
      $(this).detach().prependTo($('#'+forId));
    });        
    $("#datatable_parent").removeClass("d-none");           
    table.responsive.recalc();
    $("#datatable_pagelength").parent().detach().prependTo($('#datatable_filter'));
    $('#datatable_filter').parent().removeClass('col-sm-12').removeClass('col-md-6').addClass('col-sm-9');
    $('#datatable_length').parent().removeClass('col-sm-12').removeClass('col-md-6').addClass('col-sm-3');
    $('#datatable_info').parent().removeClass('col-sm-12').removeClass('col-md-5').addClass('col-sm-5');
    $('#datatable_paginate').parent().removeClass('col-sm-12').removeClass('col-md-7').addClass('col-sm-7');


//setInterval(function(){ table.columns.adjust().draw(); }, 3000);


    $('[data-toggle="tooltip"]').tooltip(); 


    $(".alert-fadeout").fadeTo(5000, 500).slideUp(500, function(){
        $(".alert-fadeout").slideUp(500);
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

	$(document).on("keydown", ":input:not(textarea)", function(event) {
	    if (event.key == "Enter") {
	        event.preventDefault();
	    }
	});    


  });


  
  