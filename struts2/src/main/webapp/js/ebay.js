/* store rows data */
var rowsdata = new Array();

/* initialize */
$(document).bind({
	ready: function(event) {
		
		resizediv();
		bindevents();
		
		items();
		
		return;
		
		$('ul.accounts > li > a:first').click();
		$('a.active', $('ul.accountaction:first')).click();
		
		//dump(hash);
		
		//setTimeout('autoclick()', 1000);
		//setTimeout("$('ul.editbuttons > li > a.save', 'div.detail').click()", 5000);
		
		setInterval(refresh, 2000);
		
		return;
	}
});

/* auto click for debug */
function autoclick()
{
	id = $('a.Title:lt(2):last').closest('tbody.itemrow').attr('id');
	
	$('a.Title', 'tbody#'+id).click();
	setTimeout("$('li > a:contains(Shipping)', '   tbody#'+id).click()", 2000);
	//setTimeout("$('ul.editbuttons > li > a.edit', 'tbody#'+id).click()", 2000);
	
	return;
}


/* list items */
function items()
{
	$.post('/items',
		   $('input, select', '#filter').serialize(),
		   function(data) {
			   //paging(data.cnt);
			   $('tbody:gt(2)', 'table#items').remove();
			   if (data.cnt == 0) {
				   $('tbody#rowloading > tr > td').html('No item data found.');
				   $('tbody#rowloading').show();
				   return;
			   }
			   $('tbody#rowloading').hide();
			   
			   var tmpids = new Array();
			   $.each(data.json, function(idx, row) {
				   dom = getrow(idx, row);
				   $('#items').append(dom);
				   //rowsdata[row['id']] = row;
				   //tmpids.push(row['id']);
				   rowsdata[idx] = row;
				   tmpids.push(idx);
			   });
		   },
		   'json');
	
	// todo: get detail of each items
	/*
	$.post('/users/items/',
		   $('input, select', '#filter').serialize(),
		   function(data) {
		   },
		   'json');
	*/
	
}

function getrow(idx, row)
{
	var id;
	var dom;
	
	//id = row['id'];
	id = idx;
	
	dom = $('#rowtemplate').clone().attr('id', id);
	
	$.each(row, function(colname, colval) {
		
		// todo: why @ mark error?
		if (colname.match(/\@/)) return;
		if (colname == 'PictureDetails_PictureURL') return;
		
		$('.'+colname, dom).html(colval);
	});
	
	$('a.ItemID', dom).attr('href', row.ListingDetails.ViewItemURL);
	$('td.EndTime', dom).html(row.endtime);
	
	if (typeof(row.status) == 'string') {
		$('input:checkbox', dom).css('visibility', 'hidden');
		$('input:checkbox', dom).parent().addClass('loading');
	}
	$('input:checkbox', dom).val(id);
	
	/* Picture */
	var pictstr = '';
	if (typeof(row.PictureDetails.PictureURL) == 'string') {
		pictstr = row.PictureDetails.PictureURL;
	} else if (typeof(row.PictureDetails.PictureURL) == 'object') {
		pictstr = row.PictureDetails.PictureURL[0];
	}
	if (pictstr != '') {
		$('img.PictureURL', dom).attr('src', pictstr);
	} else {
		$('img.PictureURL', dom).remove();
	}
	
	return dom;
	
	if (row['status'] == 10) {
		$('input:checkbox', dom).css('visibility', 'hidden');
		$('input:checkbox', dom).parent().addClass('loading');
	}
	$('input:checkbox', dom).val(id);
	
	$('td.UserID', dom).html(row['UserID']);
	
	
	if (row.PictureDetails.PictureURL) {
		$('img.PictureDetails_PictureURL', dom)
			.attr('src', row['PictureDetails_PictureURL'])
			.css('max-width', '20px')
			.css('max-height','20px');
	} else {
		$('img.PictureDetails_PictureURL', dom).remove();
	}
	
	if (row['SellingStatus_ListingStatus'] == 'Active') {
		st = $('<img/>').attr('src', '/icon/04/10/02.png').css('margin-right', '5px');
	} else {
		st = $(row['SellingStatus_ListingStatus']);
	}
	$('a.Title', dom).before(st);
	$('a.Title', dom)
		.prepend('['+row['ShippingDetails_ShippingType']+']')
		.prepend('['+row['Site']+']');
	if (row['SellingStatus_QuantitySold'] > 0) {
		sldd = $('<div/>')
			.css('float', 'right')
			.css('position', 'absolute')
			.css('background-color', 'yellow')
			.css('color', 'red')
			.html(row['SellingStatus_QuantitySold']+' sold!');
		$('a.Title', dom).parent().prepend(sldd);
	}
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

// todo: consider about how to generate strings for display
// todo: if build a clone of python version, it's easy if generation is in javascript.
function getdetail(row)
{
	id = row._id;
	detail = $('div.detail', '#'+id);
    
	$('input[name=Title]',    detail).replaceWith(row.Title);
	$('input[name=Subtitle]', detail).replaceWith(row.SubTitle);
	$('input[name=Quantity]', detail).replaceWith(row.Quantity);
	$('input[name=StartPrice]', detail).replaceWith(row.StartPrice
													+ ' ('+row['StartPrice@currencyID']+')');
	
	$('select[name=Site]',    detail).replaceWith(row.Site);
	tmp = $('select[name=ListingType] > option[value='+row.ListingType+']', detail).text();
	$('select[name=ListingType]', detail).replaceWith(tmp);
	
	/* paymentmethods */
	var pmstr = '<span style="color:#aaaaaa;">-</span>';
	if (typeof(row.PaymentMethods) == 'string') {
		pmstr = row.PaymentMethods;
	} else if (typeof(row.PaymentMethods) == 'object') {
		pmstr = row.PaymentMethods.join('<br>');
	}
	pmstr = pmstr.replace(/PayPal/, 'PayPal ('+row.PayPalEmailAddress+')');
	$('td.paymentmethod', detail).html(pmstr);
	
	$('td.duration', detail).text(getListingDurationLabel(row.ListingDuration));
	$('td.category', detail).html(row.PrimaryCategory.CategoryName.replace(/:/g, ' &gt; '));
	
	$('select, input', detail).replaceWith('<span style="color:#aaaaaa;">-</span>');
	
	if (row.shippingtype) {
		$('td.shippingtype_domestic', detail).html(row.shippingtype.domestic);
		$('td.shippingtype_international', detail).html(row.shippingtype.international);
	}
	if (row.ShippingDetails.ShippingServiceOptions) {
		sso = '';
		$.each(row.ShippingDetails.ShippingServiceOptions, function(i, o) {
			sso += hash[row.Site]['ShippingServiceDetails'][o.ShippingService]['Description'];
			sso += '<br>';
		});
		$('td.shippingservice', detail).html(sso);
	}
	if (row.ShippingDetails.InternationalShippingServiceOption) {
		isso = '';
		$.each(row.ShippingDetails.InternationalShippingServiceOption, function(i, o) {
			isso += hash[row.Site]['ShippingServiceDetails'][o.ShippingService]['Description'];
			if (o.ShippingServiceCost) {
				isso += ' '+o['ShippingServiceCost@currencyID']+o.ShippingServiceCost;
			}
			if (typeof(o.ShipToLocation == 'string')) {
				isso += '<br>Ship to ' + o.ShipToLocation;
			} else if (typeof(o.ShipToLocation == 'object')) {
				isso += '<br>Ship to ' + o.ShipToLocation.join(' / ');
			}
			isso += '<br>';
		});
		$('td.intlshippingservice', detail).html(isso);
	}
	
	if (row.ShippingDetails.CalculatedShippingRate) {
		csro = row.ShippingDetails.CalculatedShippingRate;
		
		sp = csro.ShippingPackage;
		if (csro.ShippingIrregular == 'true') sp += ' (Irregular package)';
		$('td.shippingpackage', detail).html(sp);
		
		dm = csro.PackageLength + csro['PackageLength@unit']
			+ ' x ' + csro.PackageWidth + csro['PackageWidth@unit']
			+ ' x ' + csro.PackageDepth + csro['PackageDepth@unit'];
		$('td.dimensions', detail).html(dm);
		
		weight = csro.WeightMajor + csro['WeightMajor@unit']
			+ ' ' + csro.WeightMinor + csro['WeightMinor@unit'];
		$('td.weight', detail).html(weight);
	}
	
	/* description */
	// todo: check html5 srcdoc attribute
	iframe = $('<iframe/>').attr('src', '/users/description/'+id);
	$('textarea[name=Description]', detail).replaceWith(iframe);
	
	/* pictures */
	if (typeof(row.PictureDetails.PictureURL) == 'string') {
		$('img.PD_PURL_1', detail).attr('src', row.PictureDetails.PictureURL);
	} else if (typeof(row.PictureDetails.PictureURL) == 'object') {
		$.each(row.PictureDetails.PictureURL, function(i, url) {
			$('img.PD_PURL_'+(i+1), detail).attr('src', url);
		});
	}
	
	
	return;

	/* preserve selected tab */
	/*
	tab = $('ul.tabNav > li.current > a', $('tbody#'+id));
	tabnum = tab.parent().prevAll().length + 1;
	$('.tabNav', detail).children('li:nth-child('+tabnum+')').addClass('current');
	$('.tabContainer', detail).children('div:nth-child('+tabnum+')').show();
	$('.tabContainer', detail).children('div:nth-child('+tabnum+')').addClass('current');
	*/
	
	if (row['PictureDetails_PictureURL']) {
		$.each(row['PictureDetails_PictureURL'], function(i, url) {
			$('img.PD_PURL_'+(i+1), detail).attr('src', url);
		});
	}
	
	/* listingtype */
	
	$('input:file', detail).remove();
	
	/* duration */
	var ldstr = getListingDurationLabel(row['ListingDuration']);
	$('td.duration', detail).text(ldstr);
	
	/* shippingservice */
	//dump(hash[row['Site']]['ShippingType']);
	if (row['ShippingDetails_ShippingType']) {
		dmstmap = hash['shippingmap'][row['ShippingDetails_ShippingType']]['domestic'];
		intlmap = hash['shippingmap'][row['ShippingDetails_ShippingType']]['international'];
		dmst = hash[row['Site']]['ShippingType']['domestic'][dmstmap];
		intl = hash[row['Site']]['ShippingType']['international'][intlmap];
		$('td.shippingtype_domestic', detail).html(dmst);
		$('td.shippingtype_international', detail).html(intl);
	}
	
	if (row['ShippingDetails_ShippingServiceOptions']) {
		ssstr = '';
		$.each(row['ShippingDetails_ShippingServiceOptions'], function(i, o) {
			ssstr += hash[row['Site']]['ShippingServiceDetails'][o['ShippingService']+'']['Description'];
			if (o['ShippingServiceCost']) {
				ssstr += ' '+o['ShippingServiceCost@currencyID']+o['ShippingServiceCost'];
			}
			ssstr += '<br>';
		});
		$('td.shippingservice', detail).html(ssstr);
	}	
	if (row['ShippingDetails_InternationalShippingServiceOption']) {
		ssstr = '';
		$.each(row['ShippingDetails_InternationalShippingServiceOption'], function(i, o) {
			ssstr += hash[row['Site']]['ShippingServiceDetails'][o['ShippingService']+'']['Description'];
			if (o['ShippingServiceCost']) {
				ssstr += ' '+o['ShippingServiceCost@currencyID']+o['ShippingServiceCost'];
			}
			ssstr += '<br>';
		});
		$('td.intlshippingservice', detail).html(ssstr);
	}	
	
	/* dimensions */
	dmstr = '';
	alert(row['ShippingDetails_CalculatedShippingRate_PackageDepth']);
	if (row['ShippingDetails_CalculatedShippingRate_PackageDepth']) {
		dmstr += row['ShippingDetails_CalculatedShippingRate_PackageDepth']
			+ row['ShippingDetails_CalculatedShippingRate_PackageDepth@unit'] + ' x ';
	}
	if (row['ShippingDetails_CalculatedShippingRate_PackageLength']) {
		dmstr += row['ShippingDetails_CalculatedShippingRate_PackageLength']
			+ row['ShippingDetails_CalculatedShippingRate_PackageLength@unit'] + ' x ';
	}
	if (row['ShippingDetails_CalculatedShippingRate_PackageWidth']) {
		dmstr += row['ShippingDetails_CalculatedShippingRate_PackageWidth']
			+ row['ShippingDetails_CalculatedShippingRate_PackageWidth@unit'];
	}
	$('td.dimensions', detail).html(dmstr);
	
	
	$.each(row, function(colname, colval) {
		$('input[name='+colname+']', detail).replaceWith($('<div>'+colval+'</div>'));
	});
	
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
				   if (action == 'copy' || action == 'delete') {
					   $("td.loading").removeClass('loading');
					   $("input[name='id[]'][value!=on]:checked")
						   .css('visibility', '')
						   .attr('checked', '');
				   }
				   if (action == 'delete') {
					   items();
				   }
				   //dump(data);
			   });
		
		return;
	});
	
	/* Left navi */
	$('ul.accounts > li > a').live('click', function() {
		
		if ($(this).closest('li').attr('class') == 'allitems'
			&& $('ul', $(this).parent().next()).css('display') == 'block') {
			// don't collapse navi
		} else {
			$('ul', $(this).parent().next()).slideToggle('fast');
		}
		
		userid = $(this).attr('class');
		$('select[name=UserID]').val(userid);
		items();
		
		$('ul.accounts li').removeClass('tabselected');
		$(this).closest('li').addClass('tabselected');
		
		return false;
	});
	
	/* Picture */
    $('input:file').live('change', function() {
		$(this).closest('form').submit();
		$(this).closest('form')[0].reset();
    });
    
	/* Site */
	$('select[name=Site]').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		site = $(this).val();
		
		sel = getcategorypulldown(site, 0);
		$('td.category', '#'+id).html(sel);
		
		if (!hash[site]['category']['grandchildren'][0]) preloadcategory(site, []);
		
		return;
	});
	
	/* Category */
	$('select.category').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		site = $('select[name=Site]', '#'+id).val();
		
		$(this).nextAll().remove();
		if (hash[site]['category']['children'][$(this).val()] != 'leaf') {
			preloadcategory(site, [$(this).val()]);
			sel = getcategorypulldown(site, $(this).val());
			$('td.category', '#'+id).append(sel);
		}
		$('select.category',      '#'+id).attr('name', '');
		$('select.category:last', '#'+id).attr('name', 'PrimaryCategory_CategoryID');
		
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
	
	
	$('ul.accounts > li > ul > li > a').live('click', function() {
		
		v = $(this).attr('class');
		userid = $(this).parent().parent().attr('class').replace(/^accountaction /, '');
		$('input[name=selling]').val(v);
		$('input[name=offset]').val(0);
		$('select[name=UserID]').val(userid);
		if (v == 'unsold' || v == 'sold' || v == 'allitems') {
			$('input[name=sort]').val('ListingDetails_EndTime DESC');
		} else {
			$('input[name=sort]').val('ListingDetails_EndTime');
		}
		items();
		$('ul.accounts li').removeClass('tabselected');
		$(this).closest('li').addClass('tabselected');
		
		return false;
	});
	
	$('a.Title').live('click', function() {
		
		var id = $(this).closest('tbody').attr('id');
		
		if (!$('tr.row2 td', '#'+id).html().match(/^<div/i)) {
			
			detail = $('div.detail', 'div#detailtemplate').clone();
			$('td:nth-child(2)', detail).hide();
			$('tr.row2 td', '#'+id).html(detail);
			$('div.detail', '#'+id).slideToggle('fast');
			
			$.post('/users/item/',
				   'id='+id,
				   function(data) {
					   dump(data);
					   getdetail(data);
					   $('td:nth-child(2)', '#'+id).fadeIn('fast');
					   
					   preloadcategory(data.Site, data.categorypath);
					   preloadcategoryfeatures(data.Site, data.PrimaryCategory.CategoryID);
					   preloadshippingtype(data.Site);
					   rowsdata[id] = data;
					   
					   //$.scrollTo('tbody#'+id, {duration:800, axis:'y', offset:0});
				   },
				   'json');
		} else {	
			$('div.detail', '#'+id).slideToggle('fast');
		}
		
		return false;
	});
	
	$('#paging > a').live('click', function() {
		limit = $('input[name=limit]').val();
		if ($(this).html() == '＞') {
			offset = ($('input[name=offset]').val() + 1) * limit;
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
		item = rowsdata[id];
		dom = $('div.detail', 'div#detailtemplate').clone().css('display', 'block');
		dump(item);
		
		$('input[name=Title]',      dom).val(item.Title);
		$('input[name=SubTitle]',   dom).val(item.SubTitle);
		$('input[name=StartPrice]', dom).val(item.StartPrice);
		$('input[name=Quantity]',   dom).val(item.Quantity);
		
		$('select[name=Site]',      dom).val(item.Site);
		
		/* category selector */
		$('td.category', dom).html(getcategorypulldowns(item.Site, item.categorypath));
		$('select.category:last', dom).attr('name', 'PrimaryCategory.CategoryID');
		
		/* pictures */
		if (typeof(item.PictureDetails.PictureURL) == 'string') {
			$('img.PD_PURL_1', dom).attr('src', item.PictureDetails.PictureURL);
		} else if (typeof(item.PictureDetails.PictureURL) == 'object') {
			$.each(item.PictureDetails.PictureURL, function(i, url) {
				$('img.PD_PURL_'+(i+1), dom).attr('src', url);
			});
		} 
		for (i=1; i<=12; i++) {
			$('input:file[name=PD_PURL_'+i+']', dom).attr('name', 'PD_PURL_'+id+'_'+i);
			$('img.PD_PURL_'+i,                 dom).attr('id',   'PD_PURL_'+id+'_'+i);
		}
		
		showbuttons(dom, 'save,cancel');
		$('div.detail', 'tbody#'+id).replaceWith(dom);
	    $('input[name=Title]', 'tbody#'+id).focus();
		
		return false;
		
		
		site = rowsdata[id]['Site'];
		categoryid = rowsdata[id]['PrimaryCategory_CategoryID'];
		
	    /* preserve selected tab */
	    tab = $('ul.tabNav > li.current > a', $('tbody#'+id));
	    tabnum = tab.parent().prevAll().length + 1;
	    $('.tabNav', dom).children('li:nth-child('+tabnum+')').addClass('current');
	    $('.tabContainer', dom).children('div:nth-child('+tabnum+')').show();
	    $('.tabContainer', dom).children('div:nth-child('+tabnum+')').addClass('current');
		
		
		$('textarea[name=description]', dom).val(rowsdata[id]['Description']);
		$('select[name=ListingType]',   dom).val(rowsdata[id]['ListingType']);
		$('select[name=Site]',          dom).val(rowsdata[id]['Site']);
		
		$.each(rowsdata[id], function(colname, colval) {
			$('input:text[name='+colname+']', dom).val(colval+'');
		});
		
		
		/* listing duration */
		tmpo = hash[site]['category']['features'][categoryid]['ListingDuration'];
		sel = $('<select/>').attr('name', 'ListingDuration');
		$.each(tmpo[rowsdata[id]['ListingType']], function(k, v) {
			opt = $('<option/>').val(k).text(v);
			if (rowsdata[id]['ListingDuration'] == k) opt.attr('selected', 'selected');
			sel.append(opt);
		});
		$('td.duration', dom).html(sel);
		
		/* payment method */
		tmpo = hash[site]['category']['features'][categoryid]['PaymentMethod'];
		$.each(tmpo, function(k, v) {
			chk = $('<input/>').attr('name', 'PaymentMethods[]').attr('type', 'checkbox').val(v);
			if (rowsdata[id]['PaymentMethods'].indexOf(v) >= 0) {
				chk.attr('checked', 'checked');
			}
			$('td.paymentmethod', dom).append(chk);
			$('td.paymentmethod', dom).append(v+'<br>');
		});
		
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
		detail = $(this).closest('div.detail');
		
		// todo: varidation check
		if ($('select[name=PrimaryCategory_CategoryID]', detail).val() == '') {
			alert('category error.');
			return false;
		}
		
		$.each($('img.PictureDetails_PictureURL', detail), function(i, imgelm) {
			imgsrc = $(imgelm).attr('src');
			if (imgsrc == '/img/noimage.jpg') {
				$("input[name='PictureDetails[PictureURL]["+(i+1)+"]']", detail).remove();
			} else {
				$("input[name='PictureDetails[PictureURL]["+(i+1)+"]']", detail).val(imgsrc);
			}
		});
		
		postdata = $('input:text, input:checkbox, input:hidden, select, textarea',
					 $(this).closest('div.detail')).serialize();
		
		$.post('/users/save/',
			   'id='+id+'&'+postdata,
			   function(data) {
				   rowsdata[id] = data;
				   getdetail(data);
				   showbuttons(detail, 'edit,copy,delete');
			   },
			   'json');
		
		return false;
	});
	
	/* Cancel */
	$('ul.editbuttons > li > a.cancel', 'div.detail').live('click', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		getdetail(rowsdata[id]);
		showbuttons(detail, 'edit,copy,delete');
		return false;
	});
	
	/* Delete */
	$('ul.editbuttons > li > a.delete', 'div.detail').live('click', function() {
		return false;
	});
	
	
	$('a.wysiwyg').live('click', function() {
		$('textarea[name=description]', '#'+id).wysiwyg('destroy');
		return false;
	});
	
	/* ShippingType */
	// todo: check all browsers can detect [domestic] selector
	$('select[name=ShippingDetails_ShippingType[domestic]]').live('change', function() {
		id = $(this).closest('tbody.itemrow').attr('id');
		sel = getshippingservice(id);
		$('td.shippingservice', '#'+id).html(sel);
		
		return;
	});
	
    //jQuery('div#loading').ajaxStart(function() {jQuery(this).show();});
    //jQuery('div#loading').ajaxStop( function() {jQuery(this).hide();});
}	

function getcategorypulldown(site, categoryid)
{
	sel = $('<select class="category"/>');
	opt = $('<option/>').val('').text('');
	sel.append(opt);
	$.each(hash[site]['category']['children'][categoryid], function(i, childid) {
		str = hash[site]['category']['name'][childid];
		if (hash[site]['category']['children'][childid] != 'leaf') str += ' &gt;';
		opt = $('<option/>').val(childid).html(str);
		sel.append(opt);
	});
	
	return sel;
}

function getcategorypulldowns(site, path)
{
	tmpid = 0;
	ctgr = hash[site]['category'];
	
	sels = $('<div/>');
	$.each(path, function(i, categoryid) {
		sel = $('<select class="category"/>');
		opt = $('<option/>').val('').text('');
		sel.append(opt);
		$.each(ctgr['children'][tmpid], function(i, cid) {
			str = ctgr['name'][cid];
			if (ctgr['children'][cid] != 'leaf') str += ' &gt;';
			opt = $('<option/>').val(cid).html(str);
			sel.append(opt);
		});
		
		sel.val(categoryid);
		tmpid = categoryid;
		
		sels.append(sel);
	});
	
	return sels.children();
}


function preloadcategory(site, path)
{
	var npath = new Array();
	
	if (!hash[site]['category']['grandchildren'][0]) npath.push(0);
	
	$.each(path, function(i, categoryid) {
		if (hash[site]['category']['grandchildren'][categoryid]) return;
		npath.push(categoryid);
	});
	
	$.getJSON('/users/grandchildren/'+site+'/'+npath.join('.'),
			  function(data) {
				  $.each(hash[site]['category'], function(n, a) {
					  var tmpo = $.extend({}, hash[site]['category'][n], data[n]);
					  hash[site]['category'][n] = tmpo;
				  });
			  });
	
	return;
}

function preloadcategoryfeatures(site, categoryid)
{
	if (hash[site]['category']['features'][categoryid]) return;
	
	$.getJSON('/users/categoryfeatures/'+site+'/'+categoryid,
			  function(data) {
				  var tmpo = $.extend({}, hash[site]['category']['features'], data['features']);
				  hash[site]['category']['features'] = tmpo;
			  });
}

function preloadshippingtype(site)
{
	if (hash[site]['ShippingType']) return;
	
	$.getJSON('/users/getShippingType/'+site,
			  function(data) {
				  hash[site]['ShippingType'] = data;
			  });
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
			   //dump(data);
		   },
		   'json');
	
	return;
}

function refresh()
{
	//dump(hash['US']['category']); 
	
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
		if (offset/limit < i-5 || i+5 < offset/limit) continue;
		if (offset == i*limit) {
			html += '<a href="" style="background-color:#cccccc;">'+(i+1)+'</a>';
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
	site = $('select[name=Site]', '#'+id).val();
	listingtype = $('select[name=ListingType]', '#'+id).val();
	tmpo = hash[site]['category']['features'][categoryid]['ListingDuration'];
	
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
	type = $('select[name=ShippingDetails_ShippingType[domestic]]', '#'+id).val();
	
	if (type == 'Calculated') {
		sel = $('<select class="ShippingPackage"/>');
		$.each(hash[site]['ShippingPackageDetails'], function(i, o) {
			$('<option/>').val(o['ShippingPackage']).html(o['Description']).appendTo(sel);
		});
		$('select[name=ShippingPackage]', '#'+id).html(sel.html());
		$('td.shippingpackage', '#'+id).children().show();
		$('td.dimensions',      '#'+id).children().show();
	} else {
		$('td.shippingpackage', '#'+id).children().hide();
		$('td.dimensions',      '#'+id).children().hide();
	}
	
	
	sel = $('<select class="ShippingService"/>');
	$.each(hash[site]['ShippingServiceDetails'], function(i, o) {
		if (o['ValidForSellingFlow'] != 'true') return;
		if (o['ShippingServiceID'] >= 50000) return;
		
		if ($.inArray(type, o['ServiceType']) >= 0 || o['ServiceType'] == type) {
			$('<option/>').val(o['ShippingService']).html(o['Description']).appendTo(sel);
		}
	});
	$('select.ShippingService', '#'+id).html(sel.html());
	//$('td.shippingservice', '#'+id).html(sel);
	
	return;
}

function getListingDurationLabel(str)
{
	if (str == 'Days_1') {
		str = "1 Day";
	} else if (str == 'GTC') {
		str = "Good 'Til Cancelled";
	} else if (str.match(/^Days_([\d]+)$/)) {
		str = str.replace(/^Days_([\d]+)$/, "$1 Days");
	}
	return str;
}