  $(function () { $('.datepicker').datepicker({'format': 'dd.mm.yyyy', 'language': 'de'})});
  $(document).ready(function(){

        

         var dynamicColors = function() {
            var r = Math.floor(Math.random() * 255);
            var g = Math.floor(Math.random() * 255);
            var b = Math.floor(Math.random() * 255);
            return "rgb(" + r + "," + g + "," + b + ")";
         };


    $('#by-relation').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/byrelation',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              console.log("resulst: " + result.responseText);
              console.log("values: " + JSON.stringify(Object.values(data)));
              var ctx = $("#by-relation").get(0).getContext('2d');
              var colors = [];
              for (var i in data) {
                colors.push(dynamicColors());
             }
              var byRelationChart = new Chart(ctx,{
                  type: 'pie',
                  data: {
                    datasets: [{data: Object.values(data), backgroundColor: colors}],
                    labels: Object.keys(data)
                  }
              });              
            }
        }); 
    })



    var table = $('#datatable').DataTable({
    	paging: false,
        language: {
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
    });
    table
    .column( '1:visible' )
    .order( 'asc' )
    .draw();
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

  });


  
  