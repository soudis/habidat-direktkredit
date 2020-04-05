const toJSON = (str) => {
    try {
        json = JSON.parse(str);
        return json;
    } catch (e) {
        return false;
    }
    
}

const showSidebar = html => {
	var sidebar = $( "#sidebar" );
	sidebar.html(html);
	sidebar.removeClass('d-none');
}

const hideSidebar = () => {
	var sidebar = $( "#sidebar" );
	sidebar.addClass('d-none');
}

const redirectOrReload = redirectURL => {
	// current value of the location href attribute
	let currentURL = $(location).attr("href");

	if (redirectURL != 'reload' && currentURL !== redirectURL) {
	    $(location).attr("href", redirectURL);
	} else {
	    location.reload();
	}	
}

$(document).ready(function(){
	$(document).on("click", ".sidebar-action", function (e) {
		e.preventDefault();
		$.get( $(this).attr("href"), function( data ) {	  		
	  		showSidebar(data);	  
		});
	});

	$(document).on("click", ".confirm-action", function (e) {

	    var link = $(this).data('link');
	    var removeTag = $(this).data('remove-tag');
	    var updateTag = $(this).data('update-tag');

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
					$.get(link, function( data ) {	 
				  		if (removeTag) {
				  			$('#' + removeTag).remove();
				  		} else if (updateTag) {
				  			$('#' + updateTag).replaceWith(data)
				  		}
			  			if (data.redirect) {
			  				redirectOrReload(data.redirect);
			  			}
					});
	           }
	        }
	    });		  
	});		

	$(document).on("click", "#body-container", function (e) {
		hideSidebar();	  
	});	


	$(document).on("submit", "form.update-form", function (e) {
		e.preventDefault();
		var form = $(this);
		hideSidebar();	  
		$.ajax({
		    url : form.attr('action'),
		    type: "POST",
		    data : new FormData(this),
		    processData: false,
		    contentType: false,		
	        success: function(data) {
	  			if (data.redirect) {
	  				redirectOrReload(data.redirect);
	  			}	        	
	       		var action = form.attr('update-action');
	       		var tag = form.attr('update-tag');
	       		if (action == 'append') {
	       			$('#' + tag).append(data);
	       		} else if (action == 'replace') {
	       			$('#' + tag).replaceWith(data);
	       		}
	       	}
       	});		
	});		
})

