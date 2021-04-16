/* jshint esversion: 8 */
const toJSON = (str) => {
    try {
        json = JSON.parse(str);
        return json;
    } catch (e) {
        return false;
    }

};

const showSidebar = html => {
	var sidebar = $( "#sidebar" );
	$('#sidebar-content').html(html);
	sidebar.addClass('shown');
	sidebar.removeClass('d-none');
	$('#sidebar-opener').addClass('d-none');
};

const hideSidebar = () => {
	var sidebar = $( "#sidebar" );
	if (sidebar.hasClass('shown')) {

		sidebar.removeClass('shown');
		$('#sidebar-opener').removeClass('d-none');
		$('.card.active').removeClass('active');
		$('tr.active').removeClass('active');
			//sidebar.addClass('out');
			//sidebar.addClass('d-none');
	}
};

const redirectOrReload = redirectURL => {
	// current value of the location href attribute
	let currentURL = $(location).attr("href");

	if (redirectURL != 'reload' && currentURL !== redirectURL) {
	    $(location).attr("href", redirectURL);
	} else {
	    location.reload();
	}
};

const errorAlert = function(error, callback=undefined) {
	var title, message;
	if (error.code && error.code.startsWith('PUG:')) {
		title = 'HTML Vorlagenfehler';
		message = error.msg + ' (' + error.filename + ':' + error.line + ':' + error.column + ')';
	}
	bootbox.dialog({
		title: title || "Fehler",
	    message: message || error,
        onEscape: true,
	    backdrop: true,
	    buttons: {
	        ok: {
	            label: 'OK',
	            className: 'btn-primary'
	        }
	    },
	    callback: callback || function() {}
	});
};

const infoAlert = function(message, callback=undefined) {
	bootbox.dialog({
		title: 'Information',
	    message: message,
        onEscape: true,
	    backdrop: true,
	    buttons: {
	        ok: {
	            label: 'OK',
	            className: 'btn-primary'
	        }
	    },
	    callback: callback || function() {}
	});
};

$(document).ready(function(){
	$(document).on("click", ".sidebar-action", function (e) {
		e.preventDefault();

		$('.card.active').removeClass('active');
		$(this).parents('.card').addClass('active');

		var url = $(this).attr("href");

	    if ($(this).data('parameters')) {
	    	url += '/' + $(this).data('parameters');
	    }

		$.ajax({
		    url : url,
		    type: "GET",
	        success: function(data) {
	        	showSidebar(data);
	       	},
	       	error: function(xhr, status, error) {
	       		var data = JSON.parse(xhr.responseText);
	       		errorAlert(data.error);
	       	}
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
				  			$('#' + updateTag).replaceWith(data);
				  		}
			  			if (data.redirect) {
			  				redirectOrReload(data.redirect);
			  			}
					});
	           }
	        }
	    });
	});

	$(document).on("click", ".direct-action", function (e) {

		e.preventDefault();

		var url = $(this).attr("href");
   		var action = $(this).data('update-action');
   		var tag = $(this).data('update-tag');		

	    if ($(this).data('parameters')) {
	    	url += '/' + $(this).data('parameters');
	    }

		$.ajax({
		    url : url,
		    type: "PUT",
	        success: function(data) {
	        	if (data.error) {
	        		errorAlert(data.error);
	        	} else {
					if (data.redirect) {
		  				redirectOrReload(data.redirect);
		  			} else if (data.message) {
		  				infoAlert(data.message);
		  			}
		       		if (action == 'append') {
		       			$('#' + tag).append(data);
		       		} else if (action == 'replace') {
		       			$('#' + tag).replaceWith(data);
		       		}
	        	}
	       	},
	       	error: function(xhr, status, error) {
	       		var data = JSON.parse(xhr.responseText);
        		errorAlert(data.error);
	       	}
       	});
	});


	$(document).on("click", "#body-container", function (e) {
		hideSidebar();
	});

	$(document).on("click", "#sidebar-opener", function (e) {
		showSidebar();
	});

	$(document).on("click", ".sidebar-closer", function (e) {
		hideSidebar();
	});


	$(document).on("submit", "form.update-form", function (e) {
		e.preventDefault();
		var form = $(this);
		form.find('.alert').remove();
		$.ajax({
		    url : form.attr('action'),
		    type: "POST",
		    data : new FormData(this),
		    processData: false,
		    contentType: false,
	        success: function(data) {
	        	if (data.error) {
	        		form.parent().append(data.html);
	        	} else {
					if (data.redirect) {
		  				redirectOrReload(data.redirect);
		  			} else if (data.message) {
		  				infoAlert(data.message);
		  			}
		       		var action = form.attr('update-action');
		       		var tag = form.attr('update-tag');
		       		if (action == 'append') {
   					    hideSidebar();
		       			$('#' + tag).append(data);
		       		} else if (action == 'replace') {
		       			$('#' + tag).replaceWith(data);
   					    hideSidebar();
		       		} else if (action === 'replace_self') {
		       			form.replaceWith(data);
		       		}
	        	}
	       	},
	       	error: function(xhr, status, error) {
	       		var data = JSON.parse(xhr.responseText);
        		form.find('.submit-button').parent().before(data.html);
        		if (data.type === 'Warning') {
        			form.append('<input type="hidden" name="ignore_warning" value="true" />')
        		}
	       	}
       	});
	});
});

