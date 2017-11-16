  $(function () { $('.datepicker').datepicker({'format': 'dd.mm.yyyy', 'language': 'de'})});
  $(document).ready(function(){
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


  
  