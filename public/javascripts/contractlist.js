$(document).ready(function(){
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

    function toggleFilters(update = false) {
    	if ($('#datatable thead tr:eq(1)').length && !update || !$('#datatable thead tr:eq(1)').length && update) {
    		$('.toggle-filters').children('span').removeClass('fa-search-minus').addClass('fa-search-plus')
    		$('#datatable thead tr:eq(1)').remove();
    		table
			 .columns().search( '' )
			 .draw();
    	} else {
    		if (update) {
    			$('#datatable thead tr:eq(1)').remove();
    		}
    		$('.toggle-filters').children('span').removeClass('fa-search-plus').addClass('fa-search-minus')
		 	$('#datatable thead tr').clone(true).appendTo( '#datatable thead' );
		    $('#datatable thead tr:eq(1) th:visible').each( function (i) {
		    	if ($(this).data('filter')) {
		    		var filterType = $(this).data('filter');
		    		var filterOptions = $(this).data('filter-options');
		    		var name = $(this).data('name');
					var title = $(this).text();
					if (filterType === 'text') {
			        	$(this).replaceWith( '<th data-filter=' + filterType + ' data-name="' + name + '"><div class="input-group input-group-sm"><div class="input-group-prepend"><span class="input-group-text"><spand class="fa fa-search"></span></span></div><input class="text-filter form-control form-control-sm" data-name="' + name + '" type="text" placeholder="'+title+'" /></div></th>' );
			        }else if (filterType === 'date') {
			        	$(this).replaceWith( '<th data-filter=' + filterType + ' data-name="' + name + '"><div class="input-group input-group-sm"><div class="input-group-prepend"><select class="custom-select-sm custom-select date-filter-operator"><option selected value="=">=</option><option value="<">&lt;</option><option value="<=">≤</option><option value=">">&gt;</option><option value=">=">≥</option></div></select></div><input class="form-control form-control-sm date-filter" data-name="' + name + '" type="date" placeholder="'+title+'" /></div></th>' );
			        }else if (filterType === 'number') {
			        	$(this).replaceWith( '<th data-filter=' + filterType + ' data-name="' + name + '"><div class="input-group input-group-sm"><div class="input-group-prepend"><select class="custom-select-sm custom-select number-filter-operator"><option selected value="=">=</option><option value="<">&lt;</option><option value="<=">≤</option><option value=">">&gt;</option><option value=">=">≥</option></div></select></div><input class="form-control form-control-sm number-filter" data-name="' + name + '" type="number" placeholder="'+title+'" /></div></th>' );
			        }else if (filterType === 'list') {
						var options = '<option selected>Alle</option>';			        	
			        	filterOptions.forEach(option => {
			        		options += '<option>'+option+'</option>'
			        	})
			        	$(this).replaceWith( '<th data-filter=' + filterType + ' data-name="' + name + '"><div class="input-group input-group-sm"><select class="custom-select custom-select-sm list-filter " data-name="' + name + '">' + options + '</select></div></th>' );			        	
			        }

		    	} else {
		    		 $(this).replaceWith('<th></th>');
		    	}

		        
		    } );  
		}    	
    }

    $('#column_select').multiselect({
        buttonClass: 'btn btn-light',
        enableHTML: true,
        buttonText: function(options, select) {
            return '<span class="fa fa-columns "></span>';
        },
        onChange: function(option, checked, select) {
            table.column($(option).val()+':name').visible(checked);
            toggleFilters(true);
        }            
    });          
    $('.datatable-buttons').children().each(function(index) {
      var forId = $(this).parent().attr('for-id');
      $(this).detach().prependTo($('#'+forId));
    });        
    $("#datatable_parent").removeClass("d-none");           
    table.responsive.recalc();
    $("#datatable_pagelength").parent().detach().prependTo($('#datatable_filter'));
    $('#datatable_filter').parent().removeClass('col-sm-12').removeClass('col-md-6').addClass('col-sm-5');
    $('#datatable_length').parent().removeClass('col-sm-12').removeClass('col-md-6').addClass('col-sm-7');
    $('#datatable_info').parent().removeClass('col-sm-12').removeClass('col-md-5').addClass('col-sm-5');
    $('#datatable_paginate').parent().removeClass('col-sm-12').removeClass('col-md-7').addClass('col-sm-7');

    $(document).on('click', '.toggle-filters', function () {    	
    	toggleFilters(false);
	});  

    $(document).on( 'keyup change', '.text-filter', function () {
    	var name = $(this).data('name');
        if ( table.column(name + ':name').search() !== this.value ) {
            table
                .column(name + ':name')
                .search( this.value );
            updateCustomFilters();                
        }
    } );	

    $(document).on( 'change', '.list-filter', function () {
    	var name = $(this).data('name');
        if ( table.column(name + ':name').search() !== this.value ) {
            table
                .column(name + ':name')
                .search( this.value!=='Alle'?this.value:'' );
            updateCustomFilters();
        }
    } );	

    function popCustomFilters(count) {
        for (var i=0; i<count; i++) {
            $.fn.dataTable.ext.search.pop();
        }        
    }		

    var orderTriggerDisabled = false;
    $('#datatable').on( 'order.dt', function () {
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
        $('#datatable thead tr:eq(1) th:visible').each(function(i)  {
            var filterType = $(this).data('filter');
            var name = $(this).data('name');
            if (filterType === 'date') {
                var element = $(this).find('input.date-filter')
                var name = element.data('name');
                var searchValueText = element.val();
                var searchValue = moment(element.val());
                var operator = element.prev().children('select').val();
                var colIndex = table.column(name + ':name').index(false);
                customFilterCount++;
                $.fn.dataTable.ext.search.push(
                    function( settings, data, dataIndex ) {
                        var val = moment(data[colIndex], 'DD.MM.YYYY');

                        if (searchValueText == '') {
                            return true;
                        }else if (operator === '=') {
                            return searchValue.isSame(val);
                        } else if (operator === '<') {
                            return searchValue.isAfter(val);
                        } else if (operator === '<=') {
                            return searchValue.isSameOrAfter(val);
                        } else if (operator === '>') {
                            return searchValue.isBefore(val);
                        } else if (operator === '>=') {
                            return searchValue.isSameOrBefore(val);
                        } else {
                            return true;
                        }
                    }
                );                       
            } else if (filterType === 'number') {
                var element = $(this).find('input.number-filter');
                var name = element.data('name');
                var searchValue = element.val();
                var operator = element.prev().children('select').val();
                var colIndex = table.column(name + ':name').index(false);
                customFilterCount++;
                $.fn.dataTable.ext.search.push(
                    function( settings, data, dataIndex ) {
                        var val = parseInt(data[colIndex].split('.').join('').split(',').join('.'));
                        if (searchValue == '') {
                            return true;
                        }else if (operator === '=') {
                            return searchValue == val;
                        } else if (operator === '<') {
                            return searchValue > val;
                        } else if (operator === '<=') {
                            return searchValue >= val;
                        } else if (operator === '>') {
                            return searchValue < val;
                        } else if (operator === '>=') {
                            return searchValue <= val;
                        } else {
                            return true;
                        }
                    }
                );      
                     
            }
        });  
        if (pop) {
            reDrawTable();
            popCustomFilters(customFilterCount);
        } 
        return customFilterCount;
    }

    $(document).on( 'change keyup', '#datatable_filter input', function () {
        updateCustomFilters();
    } );    

    $(document).on( 'keyup change', '.date-filter', function () {
    	updateCustomFilters();
    } );

    $(document).on( 'change', '.date-filter-operator', function () {
    	$(this).parent().next().change();
    })

    $(document).on( 'keyup change', '.number-filter', function () {
    	updateCustomFilters();
    } );

    $(document).on( 'change', '.number-filter-operator', function () {
    	$(this).parent().next().change();
    })    

    function getCurrentView() {
        var view = {
            columnsSelected: $('#column_select').val(),
            tableSearch : table.search(),
            pageLength: $('#datatable_pagelength select').val(),
            order: table.order(),
            columnFilters: [],
            columnFiltersEnabled: false
        }
        $('#datatable thead tr:eq(1) th:visible').each(function(i)  {
            view.columnFiltersEnabled = true;
            var filterType = $(this).data('filter');
            var name = $(this).data('name');
            if (filterType === 'text' && $(this).find('input.text-filter').val() != '') {
                view.columnFilters.push({
                    name: name,
                    type: filterType,
                    value: $(this).find('input.text-filter').val()
                })
            } else if (filterType === 'date' && $(this).find('input.date-filter').val() != '') {
                view.columnFilters.push({
                    name: name,
                    type: filterType,
                    value: $(this).find('input.date-filter').val(),
                    operator: $(this).find('select.date-filter-operator').val()
                })                        
            } else if (filterType === 'number' && $(this).find('input.number-filter').val() != '') {
                view.columnFilters.push({
                    name: name,
                    type: filterType,
                    value: $(this).find('input.number-filter').val(),
                    operator: $(this).find('select.number-filter-operator').val()
                })                        
            } else if (filterType === 'list' && $(this).children('select.list-filter').val() != '') {
                view.columnFilters.push({
                    name: name,
                    type: filterType,
                    value: $(this).find('select.list-filter').val()
                })                        
            }
        });        
        return view;
    }

    function setColumnsSelected(columnsSelected) {
        $('#column_select').val().forEach(column => {
            table.column(column + ':name').visible(false);
        })
        $('#column_select').multiselect('deselectAll', false);
        columnsSelected.forEach(column => {
            $('#column_select').multiselect('select', column);
            table.column(column+':name').visible(true);
        })        
    }

    function restoreView(view) {
        table.search('').columns().search('');

        if (view.tableSearch) {
            table.search(view.tableSearch);
        } 
        if (view.pageLength) {
            $('#datatable_pagelength select').val(view.pageLength);
        } 
        if (view.columnsSelected) {
            setColumnsSelected(view.columnsSelected);
            reDrawTable();
        } 
        var customFilterCount = 0;
        if (view.columnFiltersEnabled) {
            if (!$('#datatable thead tr:eq(1) th:visible').length) {
                toggleFilters();
            } else {
                toggleFilters(true);
            }
            reDrawTable();

            $('#datatable thead tr:eq(1) th:visible').each(function(i)  {
                var filterType = $(this).data('filter');
                var name = $(this).data('name');
                var columnFilter = view.columnFilters.find(filter => { return filter.name === name;});
                if (columnFilter) {
                    if (filterType === 'text' && columnFilter.value != '') {
                        $(this).find('input.text-filter').val(columnFilter.value);
                        $(this).find('input.text-filter').change();
                    } else if (filterType === 'date' && columnFilter.value != '') {
                        $(this).find('input.date-filter').val(columnFilter.value);
                        $(this).find('select.date-filter-operator').val(columnFilter.operator)     ;        
                    } else if (filterType === 'number' && columnFilter.value != '') {
                        $(this).find('input.number-filter').val(columnFilter.value);
                        $(this).find('select.number-filter-operator').val(columnFilter.operator) ;    
                    } else if (filterType === 'list' && columnFilter.value != '') {
                        $(this).find('select.list-filter').val(columnFilter.value);
                        $(this).find('select.list-filter').change();
                    }
                } 

            }); 
            customFilterCount= updateCustomFilters(false);
        } else {
            if ($('#datatable thead tr:eq(1) th:visible').length) {
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

    function saveView(view, id=undefined) {
        $.ajax({
            url : '/user/saveview' + (id?('/'+id):''),
            type: "POST",
            contentType: 'application/json',
            data: JSON.stringify({view: view}),
            success: function(response) {
                var views = $('#saved_views').data('views');
                if (id) {
                    views.splice(id, 1, view);
                    $('#saved_views').data('views', views);
                } else {
                    views.push(view);
                    $('#saved_views').data('views', views);
                    $('#saved_views').append($('<option>', {
                        text: view.name,
                        value: response.id
                    })); 
                }                
                console.log(response.id);
                $('#saved_views').val(response.id);
                bootbox.alert('Ansicht ' + view.name + ' gespeichert!');
            },
            error: function(xhr, status, error) {
                var data = JSON.parse(xhr.responseText);
                errorAlert(data.error);
            }
        });  
    }

    $(document).on( 'click', '.create-view', function () {
        bootbox.prompt({
            size: "small",
            placeholder: "Name der Ansicht",
            title: "Ansicht speichern", 
            callback: function(result){
                
                var view = getCurrentView();
                view.name = result;
                saveView(view);                             

            },
            buttons: {
                confirm: {
                    label: 'Speichern',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'Abbrechen',
                    className: 'btn-danger'
                }
            },            
        })
    })    

    $(document).on( 'click', '.save-view', function () {    
        var view = getCurrentView();
        var id = parseInt($('#saved_views').val());
        var views = $('#saved_views').data('views');
        view.name = views[id].name;
        saveView(view, id);
    });

    $(document).on( 'click', '.delete-view', function () {    
        var id = $('#saved_views').val();
        var views = $('#saved_views').data('views');
        view = views[id];        
        $.ajax({
            url : '/user/deleteview/'+id,
            type: "GET",
            contentType: 'application/json',
            success: function(response) {
                var views = $('#saved_views').data('views');
                views.splice(id, 1);
                var index = id;
                $('#saved_views option:eq(' + id+1 + ')').nextAll().each(function(i) {
                    $(this).replaceWith($('<option>', {
                        text: views[index].name,
                        value: index
                    })); 
                    index ++;
                })
                $('#saved_views option:eq(' + id+1 + ')').remove();
                $('#saved_views').data('views', views);
                $('#saved_views').val('default');
                bootbox.alert('Ansicht ' + view.name + ' gelöscht!');
            },
            error: function(xhr, status, error) {
                var data = JSON.parse(xhr.responseText);
                errorAlert(data.error);
            }
        });          
    });    

    $('#saved_views').data('default', getCurrentView());
    $(document).on( 'change', '#saved_views', function () { 
        var views = $('#saved_views').data('views');
        var id = $(this).val();
        var view;
        if (id === 'default') {
            view = $('#saved_views').data('default');
        }
        else {
            view = views[id];    
        }        
        if (!view) {
            table
                .search('')
                .columns().search( '' )
                .draw();                
        } else {
            restoreView(view);
        }
    })

    $(document).on( 'click', '.export-data', function () {    
        var fields = $('#column_select').val();
        var users = []
        table.column('user_id:name', { search:'applied' }).data().each((value) => users.push(value));
        var contracts = [];
        table.column('contract_id:name', { search:'applied' }).data().each((value) => contracts.push(value));;
        console.log('huhu');
        
        $('<form action="/user/export" method="POST"></form>')
            .append('<input name="fields" value="' + fields + '" />')
            .append('<input name="users" value="' + users + '" />')
            .append('<input name="contracts" value="' +contracts + '" />')
            .appendTo('body')
            .submit()     
            .remove();   
    });      


});