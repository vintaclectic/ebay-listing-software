/* store rows data */
var rowsdata = new Array();

/* initialize */
$(document).bind({
	ready: function(event) {
		resizediv();
		bindevents();
		$('ul#selling > li > a.active').click();
		
		$.getJSON('/users/grandchildren/US/',
				  function(data) {
					  $.each(data, function(i, arr) {
						  hash['US']['category'][i]['c'] = arr['c'];
					  });
					  
					  
					  /*
						$.getJSON('/users/grandchildren/US/619',
						function(data) {
						$.each(data, function(i, arr) {
						hash['US']['category']['c619']['c'][i]['c'] = arr['c'];
						});
						});
						*/
				  });
		
		/* auto click for debug */
		setTimeout("$('a.Title:lt(2):last').click()", 1000);
		setTimeout("$('ul.editbuttons > li > a.edit', 'div.detail').click()", 3000);
		//setTimeout("$('li > a:contains(Shipping)').click()", 3000);
		
		setInterval(refresh, 2000);
	}
});

/* list items */
function items()
{
	$.post('/users/items/',
		   $('input, select', '#filter').serialize(),
		   function(data) {
			   
			   paging(data.cnt);
			   
			   $('tbody:gt(2)', 'table#items').remove();
			   
			   if (data.cnt == 0) {
				   $('tbody#rowloading > tr > td').html('No item data found.');
				   $('tbody#rowloading').show();
				   return;
			   }
			   $('tbody#rowloading').hide();
			   
			   $.each(data.res, function(idx, row) {
				   dom = getrow(row);
				   $('#items').append(dom);
				   rowsdata[row['id']] = row;
			   });
			   
		   },
		   'json');
}

function getrow(row)
{
	var id;
	var dom;
	
	id = row['id'];
	
	dom = $('#rowtemplate').clone().attr('id', id);
	
	var ts = "";
	$.each(row, function(colname, colval) {

		// todo: why at mark error?
		if (colname.match(/\@/)) return;
		
		$('.'+colname, dom).html(colval);
	});
	
	if (row['status'] == 10) {
		$('input:checkbox', dom).css('visibility', 'hidden');
		$('input:checkbox', dom).parent().addClass('loading');
	}
	$('input:checkbox', dom).val(id);
	
	$('a.ItemID', dom).attr('href', row['ListingDetails_ViewItemURL']);
	
	if (row['PictureDetails_PictureURL']) {
		$('img.PictureDetails_PictureURL', dom).attr('src', row['PictureDetails_PictureURL']);
		$('img.PictureDetails_PictureURL', dom).css('max-width', '20px');
		$('img.PictureDetails_PictureURL', dom).css('max-height','20px');
	} else {
		$('img.PictureDetails_PictureURL', dom).remove();
	}
	
	if (row['SellingStatus_ListingStatus'] == 'Active') {
		st = $('<img/>').attr('src', '/icon/04/10/02.png').css('margin-right', '5px');
	} else {
		st = $(row['SellingStatus_ListingStatus']);
	}
	$('a.Title', dom).before(st);
	$('a.Title', dom).prepend(row['PrimaryCategory_CategoryID']);
	
	if (row['Errors_LongMessage']) {
		$.each(row['Errors_LongMessage'], function(k, v) {
			if (v != '') {
				$('a.Title', dom).after('<span class="error">'+v+'</span>');
				$('a.Title', dom).after('<br>');
			}
		});
	}
	
	if (row['schedule']) {
		$('td.ListingDetails_EndTime', dom).html('<img src="/icon/02/10/03.png"> '+row['schedule']);
	}
	
	return dom;
}

function getdetail(row)
{
	id = row['id'];
	detail = $('div.detail', 'div#detailtemplate').clone();
    
	/* preserve selected tab */
	tab = $('ul.tabNav > li.current > a', $('tbody#'+id));
	tabnum = tab.parent().prevAll().length + 1;
	$('.tabNav', detail).children('li:nth-child('+tabnum+')').addClass('current');
	$('.tabContainer', detail).children('div:nth-child('+tabnum+')').show();
	$('.tabContainer', detail).children('div:nth-child('+tabnum+')').addClass('current');
	
	if (row['PictureDetails_PictureURL']) {
		$.each(row['PictureDetails_PictureURL'], function(i, url) {
			$('img.PD_PURL_'+(i+1), detail).attr('src', url);
		});
	}
	
	iframe = $('<iframe/>').attr('src', '/users/description/'+id);
	$('textarea[name=description]', detail).replaceWith(iframe);
	
	tmpv = $('select[name=ListingType] > option[value='+row['ListingType']+']', detail).text();
	$('select[name=ListingType]', detail).replaceWith(tmpv);
	
	$('input:file', detail).remove();
	
	/* site */
	$('select[name=Site]', detail).replaceWith(row['Site']);
	
	/* category */
	var pathstr = '';
	if (row['categorypath']) {
		$.each(row['categorypath'], function(level, category) {
			if (pathstr != '') pathstr += ' &gt; ';
			pathstr += category['n'];
		});
	} else {
		pathstr = '<span class="error">not selected</span>';
	}
	$('td.category', detail).html(pathstr);
	
	/* duration */
	var ldstr = row['categoryfeatures']['ListingDuration'][row['ListingType']][row['ListingDuration']];
	$('td.duration', detail).text(ldstr);
	
	var pmstr = "";
	if (row['PaymentMethods']) {
		pmstr = row['PaymentMethods'].replace(/\n/g, '<br>');
	}
	$('td.paymentmethod', detail).html(pmstr);
	
	/* shippingservice */
	if (row['ShippingDetails_ShippingServiceOptions']) {
		ssstr = '';
		$.each(row['ShippingDetails_ShippingServiceOptions'], function(i, o) {
			ssstr += o['ShippingService'] + '<br>';
		});
		$('td.shippingservice', detail).html(ssstr);
	}	
	
	$.each(row, function(colname, colval) {
		$('input[name='+colname+']', detail).replaceWith($('<div>'+colval+'</div>'));
	});
	
	return detail;
}


function descriptionframe(id)
{
	iframe = $('iframe.description', 'tbody#'+id);
	
	$(iframe).attr('src', '/users/description/'+id);
	
	if ($(td).html().match(/^<iframe/i)) return;
	
	description = $('<iframe/>').attr('src', '/users/description/'+itemid);
	
	$(td).html(description);
	
	return;
}

function resizediv()
{
	w = $('div#container').width()-179;
	h = $('body').height() - 10;
	
	$('div#content').width(w);
	$('table#items').width(w);
	$('a.Title').parent().width(w-600);
	$('div.tabContainer').width(w-32);
	
	//$('table#items').css('min-height', h+'px');
	
	return;
}

function bindevents()
{
	$(window).resize(function() {
		resizediv();
	});
	
	$('div#bulkbuttons > input').live('click', function() {
		action = $(this).attr('class');
		
		if (action == 'checkall') {
			$("input[name='id[]'][value!=on]").attr('checked', 'checked');
			return;
		} else if (action == 'checkallpage') {
			$("input[name='id[]'][value!=on]").attr('checked', 'checked');
			return;
		} else if (action == 'uncheckall') {
			$("input[name='id[]'][value!=on]").attr('checked', '');
			return;
		}
		var postdata = "";
		postdata = $("input[name='id[]'][value!=on]:checked").serialize();
		
		$("input[name='id[]']:checked").each(function() {
			$(this).css('visibility', 'hidden');
			$(this).parent().addClass('loading');
		});
		
		$.post('/users/'+action+'/',
			   postdata,
			   function(data) {
				   if (action == 'copy') {
					   $("td.loading").removeClass('loading');
					   $("input[name='id[]'][value!=on]:checked").css('visibility', '').attr('checked', '');
				   }
				   dump(data);
			   });
		
		return;
	});
	
	$('a.accountaction').live('click', function() {
		$('ul', $(this).parent()).slideToggle('fast');
	});
	
	/* Picture */
    $('input:file').live('change', function() {
		$(this).closest('form').submit();
		$(this).closest('form')[0].reset();
    });
    
	/* Site */
	$('select[name=Site]').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		sel = getcategorypulldowns($(this).val(), [0]);
		$('td.category', '#'+id).html(sel);
		return;
	});
	
	/* Category */
	$('select.category').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		site = $('select[name=Site]', '#'+id).val();
		
		tmppath = [];
		$.each($(this).prevAll(), function(i, o) {
			tmppath.push($(o).val());
		});
		tmppath.push($(this).val());
		
		sel = getcategorypulldown(site, tmppath);
		$(this).nextAll().remove();
		$('td.category', '#'+id).append(sel);
		
		return;
		
		sel = getcategorypulldown(site, categoryid);
		$(this).nextAll().remove();
		$('td.category', '#'+id).append(sel);
		
		$('select.category',      '#'+id).attr('name', '');
		$('select.category:last', '#'+id).attr('name', 'PrimaryCategory_CategoryID');
		
		//preloadcategory(site, categoryid);
		
		return;
	});
	
	$('select[name=ListingType]').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		updateduration(id);
	});
	
	$('ul.tabNav a').live('click', function() {
		id = $(this).closest('tbody').attr('id');
		var curIdx = $(this).parent().prevAll().length + 1;
		$(this).parent().parent().children('.current').removeClass('current');
		$(this).parent().addClass('current');
		$('div.tabContainer', 'tbody#'+id).children('.current').hide();
		$('div.tabContainer', 'tbody#'+id).children('.current').removeClass('current');
		$('div.tabContainer', 'tbody#'+id).children('div:nth-child('+curIdx+')').show();
		$('div.tabContainer', 'tbody#'+id).children('div:nth-child('+curIdx+')').addClass('current');
		
		return false;
	});
	
	
	$('ul#selling > li > a').live('click', function() {
		$('input[name=selling]').val($(this).attr('class'));
		$('input[name=offset]').val(0);
		items();
		$('ul#selling li').removeClass('tabselected');
		$(this).closest('li').addClass('tabselected');
		
		var debug;
		debug = $('div#container').width() + '<br>';
		debug += $('div#content').width() + '<br>';
		debug += $('table#items').width() + '<br>';
		$('div#debug').html(debug);

		return false;
	});
	
	$('a.Title').live('click', function() {
		
		var id = $(this).closest('tbody').attr('id');
		
		if (!$('tr.row2 td', '#'+id).html().match(/^<div/i)) {
			$.post('/users/item/',
				   'id='+id,
				   function(data) {
					   
					   rowsdata[id] = data;
					   detail = getdetail(data);
					   $('tr.row2 td', '#'+id).html(detail);
					   $('div.detail', '#'+id).slideToggle('fast');
					   
					   //$.scrollTo('tbody#'+id, {duration:800, axis:'y', offset:0});
					   
					   preloadcategory(data['Site'], data['categorypath']);
				   },
				   'json');
		} else {
			$('div.detail', '#'+id).slideToggle('fast');
		}
		
		
		return false;
	});
	
	$('#paging > a').live('click', function() {
		if ($(this).html() == '＞') {
			offset = ($('input[name=offset]').val() + 1) * limit;
			alert(offset);
		} else {
			offset = ($(this).html() - 1) * limit;
		}
		$('input[name=offset]').val(offset);
		items();
		return false;
	});
	
	/* Edit */
	$('ul.editbuttons > li > a.edit', 'div.detail').live('click', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		dom = $('div.detail', 'div#detailtemplate').clone().css('display', 'block');
		
	    /* preserve selected tab */
	    tab = $('ul.tabNav > li.current > a', $('tbody#'+id));
	    tabnum = tab.parent().prevAll().length + 1;
	    $('.tabNav', dom).children('li:nth-child('+tabnum+')').addClass('current');
	    $('.tabContainer', dom).children('div:nth-child('+tabnum+')').show();
	    $('.tabContainer', dom).children('div:nth-child('+tabnum+')').addClass('current');
		
		/* replace form values */
		$.each(rowsdata[id]['PictureDetails_PictureURL'], function(i, url) {
			$('img.PD_PURL_'+(i+1), dom).attr('src', url);
		});
		for (i=1; i<=12; i++) {
			$('input:file[name=PD_PURL_'+i+']', dom).attr('name', 'PD_PURL_'+id+'_'+i);
			$('img.PD_PURL_'+i,                 dom).attr('id',   'PD_PURL_'+id+'_'+i);
		}
		
		$('textarea[name=description]', dom).val(rowsdata[id]['Description']);
		$('select[name=ListingType]',   dom).val(rowsdata[id]['ListingType']);
		$('select[name=Site]',          dom).val(rowsdata[id]['Site']);
		
		$.each(rowsdata[id], function(colname, colval) {
			$('input:text[name='+colname+']', dom).val(colval+'');
		});
		
		/* category selector */
		sels = getcategorypulldowns(rowsdata[id]['Site'], rowsdata[id]['categorypath']);
		$('td.category', dom).html(sels);
		$('select.category:last', dom).attr('name', 'PrimaryCategory_CategoryID');
		
if (0) {		
		/* listing duration */
		sel = $('<select/>').attr('name', 'ListingDuration');
		$.each(rowsdata[id]['categoryfeatures']['ListingDuration'][rowsdata[id]['ListingType']], function(k, v) {
			opt = $('<option/>').val(k).text(v);
			if (rowsdata[id]['ListingDuration'] == k) opt.attr('selected', 'selected');
			sel.append(opt);
		});
		$('td.duration', dom).html(sel);
		
		/* payment method */
		if (rowsdata[id]['categoryfeatures']['PaymentMethod']) {
			$.each(rowsdata[id]['categoryfeatures']['PaymentMethod'], function(k, v) {
				chk = $('<input/>').attr('name', 'PaymentMethods[]').attr('type', 'checkbox').val(v);
				if (rowsdata[id]['PaymentMethods'].indexOf(v) >= 0) {
					chk.attr('checked', 'checked');
				}
				$('td.paymentmethod', dom).append(chk);
				$('td.paymentmethod', dom).append(v+'<br>');
			});
			//$('td.paymentmethod', dom).append('<hr>'+rowsdata[id]['PaymentMethods']);
		}
}		
		showbuttons(dom, 'save,cancel');
		
		$('div.detail', 'tbody#'+id).replaceWith(dom);
		
		// todo: compare with CKEditor
		$('textarea[name=description]', '#'+id).wysiwyg();
		
	    $('input[name=Title]', 'tbody#'+id).focus();
	    
//		$('td.shippingservice', '#'+id).append(getshippingservice(id));
		
		return false;
	});
	
	
	/* Save */
	$('ul.editbuttons > li > a.save', 'div.detail').live('click', function() {
		
		id = $(this).closest('tbody.itemrow').attr('id');
		
		// todo: varidation check
		if ($('select[name=PrimaryCategory_CategoryID]', $(this).closest('div.detail')).val() == '') {
			alert('category error.');
			return false;
		}
		postdata = $('input:text, input:checkbox, input:hidden, select, textarea',
					 $(this).closest('div.detail')).serialize();
		
		$.post('/users/save/',
			   'id='+id+'&'+postdata,
			   function(data) {
				   rowsdata[id] = data;
				   
				   dom = getrow(data);
				   detail = getdetail(data);
				   detail.css('display', 'block');
				   $('tr.row2 td', dom).html(detail);
				   $('tbody#'+id).replaceWith(dom);
			   },
			   'json');
		
		return false;
	});
	
	
	/* Cancel */
	$('ul.editbuttons > li > a.cancel', 'div.detail').live('click', function() {
		
		id = $(this).closest('tbody.itemrow').attr('id');
		
		detail = getdetail(rowsdata[id]);
		detail.css('display', 'block');
		showbuttons(detail, 'edit,copy,delete');
		$('div.detail', 'tbody#'+id).replaceWith(detail);
		
		return false;
	});
	
	
	/* Delete */
	$('#Delete').live('click', function() {
		$.post();
	});

	$('a.wysiwyg').live('click', function() {
		$('textarea[name=description]', '#'+id).wysiwyg('destroy');
		return false;
	});
	
	$('select[name=ShippingType]').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		sel = getshippingservice(id);
		$('td.shippingservice', '#'+id).html(sel);
		
		return;
	});
	
    //jQuery('div#loading').ajaxStart(function() {jQuery(this).show();});
    //jQuery('div#loading').ajaxStop( function() {jQuery(this).hide();});
}	

function getcategorypulldown(site, path)
{
	cato = hash[site]['category'];

	$.each(path, function(i, categoryid) {
		alert(categoryid);
		if (cato['c'+categoryid]['c']) {
			cato = cato['c'+categoryid]['c'];
			alert($.dump(cato));
		}
	});
	
	sel = $('<select class="category"/>');
	opt = $('<option/>').val('').text('');
	sel.append(opt);
	$.each(cato, function(id, row) {
		str = row['n'];
		if (row['c'] != 'l') str += ' &gt;';
		opt = $('<option/>').val(id.replace(/^c/, '')).html(str);
		sel.append(opt);
	});
	
	return sel;
}

function getcategorypulldowns(site, path)
{
	cato = hash[site]['category'];
	
	sels = $('<div/>');
	$.each(path, function(level, category) {
		
		sel = $('<select class="category"/>');
		opt = $('<option/>').val('').text('');
		sel.append(opt);
		$.each(cato, function(id, row) {
			str = row['n'];
			if (row['c'] != 'leaf') str += ' &gt;';
			opt = $('<option/>').val(id.replace(/^c/, '')).html(str);
			sel.append(opt);
		});
		
		if (category['i']) {
			if (cato['c'+category['i']]['c']) {
				sel.val(category['i']);
				cato = cato['c'+category['i']]['c'];
			}
		}
		
		sels.append(sel);
	});
	
	return sels.children();
}


//function preloadcategory(site, categoryid)
function preloadcategory(site, path)
{
	debug = $.dump(path);
	//alert(debug);
	
	cato = hash[site]['category'];
	
	var npath = new Array();
	$.each(path, function(level, category) {
		if (cato['c'+category['i']]) {
			if (cato['c'+category['i']]['c']) {
				cato = cato['c'+category['i']]['c'];
				return;
			}
		}
		
		npath.push(category['i']);
	});
	
	//alert($.dump(cato));
	
	$.getJSON('/users/getchildrenbypath/'+site+'/'+npath.join('.'),
			  function(data) {
				  cato['c'+npath[0]]['c'] = data;
			  });
	
	return;
}

function savecategorycache(data)
{
	$.each(data, function(site, arr) {
		$.each(arr, function(categoryid, children) {
			alert(categoryid);
			//hash[site]['category'][categoryid]['c'] = children;
		});
	});
	
	return;
}


function copyitems()
{
	var postdata = "";
	postdata = $("input[name='id[]'][value!=on]:checked").serialize();
	
	$.post('/users/copy/',
		   postdata,
		   function(data) {
			   $("td.loading").removeClass('loading');
			   $("input[name='id[]'][value!=on]:checked").css('visibility', '').attr('checked', '');
			   dump(data);
		   },
		   'json');
	
	return;
}

function refresh()
{
	dump(hash['US']['category']); 
	
	loadings = $('td.loading');
	if (loadings.length <= 0) return;
	
	// todo: check firefox pseudo class .... warning
	loadings = $('td.loading > input:checkbox[name=id[]][value!=on]');
	
	$.post('/users/items/',
		   loadings.serialize(),
		   function(data) {
			   $.each(data.res, function(idx, row) {
				   dom = getrow(row);
				   if (row['status'] == 0) {
					   $('input:checkbox', dom).css('visibility', '').attr('checked', '');
					   $('input:checkbox', dom).parent().removeClass('loading');
					   $('tbody#'+row['id']).replaceWith(dom);
				   }
				   rowsdata[row['id']] = row;
			   });
		   },
		   'json');
	
	return;
}

function additems()
{
	var postdata = "";
	postdata = $("input[name='id[]'][value!=on]:checked").serialize();
	
	$("input[name='id[]']:checked").each(function() {
		$(this).css('visibility', 'hidden');
		$(this).parent().addClass('loading');
	});
	
	$.post('/users/additems/',
		   postdata,
		   function(data) {
			   $('#debug').html('<pre>'+data+'</pre>');
		   });
	
	return;
}

// todo: merge with additems
function enditems()
{
	var postdata = "";
	postdata = $("input[name='id[]'][value!=on]:checked").serialize();
	
	$("input[name='id[]']:checked").each(function() {
		$(this).css('visibility', 'hidden');
		$(this).parent().addClass('loading');
	});
	
	$.post('/users/enditems/',
		   postdata,
		   function(data) {
			   $('#debug').html('<pre>'+data+'</pre>');
		   });
	
	return;
}

function filter()
{
	$('input[name=offset]').val(0);
	items();
	return;
}

function paging(cnt)
{
	var limit;
	var offset;
	
	limit  = $('input[name=limit]').val() - 0;
	offset = $('input[name=offset]').val() - 0;
	
	html = (offset+1)+' - ';
	if (offset+limit >= cnt) {
		html += cnt;
	} else {
		html += (offset+limit);
	}
	html += ' of '+cnt+'&nbsp;';
	
	for (i=0; i<(cnt/limit); i++) {
		if (offset/limit < i-5 || i+5 < offset/limit) {
			continue;
		}
		if (offset == i*limit) {
			html += '<a href="" style="background-color:#ccffcc;">'+(i+1)+'</a>';
		} else {
			html += '<a href="">'+(i+1)+'</a>';
		}
	}
	if (offset+limit<cnt) {
		html += '<a href="">＞</a>';
	}
	
	$('#paging').html(html);
	
	return;
}

function chkall()
{
	$("input:checkbox[value!=on]").attr('checked', 'checked');
}

function unchkall()
{
	$(":checkbox").attr('checked', '');
}

function showbuttons(detail, buttons)
{
	buttons = 'a.'+buttons.replace(/,/g, ',a.');
	
	ulbtn = $('ul.editbuttons', detail);
	$('ul.editbuttons > li', detail).hide();
	$(buttons, ulbtn).parent().show();
	
	return;
}

function dump(o)
{
	$('div#debug').html('<pre>'+$.dump(o)+'</pre>');
}

function updateduration(id)
{
	listingtype = $('select[name=ListingType]', '#'+id).val();
	
	sel = $('<select/>').attr('name', 'ListingDuration');
	$.each(rowsdata[id]['categoryfeatures']['ListingDuration'][listingtype], function(k, v) {
		opt = $('<option/>').val(k).text(v);
		sel.append(opt);
	});
	$('select[name=ListingDuration]', '#'+id).replaceWith(sel);
	
	return;
}

function getshippingservice(id)
{
	site = $('select[name=Site]', '#'+id).val();
	type = $('select[name=ShippingType]', '#'+id).val();
	
	if (type == 'Calculated') {
		sel = $('<select class="ShippingPackage"/>');
		$.each(hash['ShippingPackageDetails'][site], function(i, o) {
			opt = $('<option/>').val(o['ShippingPackage']).html(o['Description']);
			sel.append(opt);
		});
		$('select[name=ShippingPackage]', '#'+id).html(sel.html());
		$('div.ShippingPackage', '#'+id).show();
		$('div.Dimensions',      '#'+id).show();
	} else {
		$('div.ShippingPackage', '#'+id).hide();
		$('div.Dimensions',      '#'+id).hide();
	}
	
	
	sel = $('<select class="ShippingService"/>');
	$.each(hash['ShippingServiceDetails'][site], function(i, o) {
		if (o['ValidForSellingFlow'] != 'true') return;
		if (o['ShippingServiceID'] >= 50000) return;
		
		if ($.inArray(type, o['ServiceType']) >= 0 || o['ServiceType'] == type) {
			opt = $('<option/>').val(o['ShippingService']).html(o['Description']);
			
			sel.append(opt);
		}
	});
	$('select.ShippingService', '#'+id).html(sel.html());
	//$('td.shippingservice', '#'+id).html(sel);
	
	return;
}
