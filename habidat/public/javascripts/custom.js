  $(function () { $('.datepicker').datepicker({'format': 'dd.mm.yyyy', 'language': 'de'})});
  $(document).ready(function(){
    var table = $('#datatable').DataTable({
    	paging: false,
    });
    table
    .column( '1:visible' )
    .order( 'asc' )
    .draw();
    $('[data-toggle="tooltip"]').tooltip(); 
  });
  
  