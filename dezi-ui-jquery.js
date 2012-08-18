/* jQuery Dezi::UI example */
/* Copyright 2012 Peter Karman karpet@dezi.org */
// Inspired by http://nuggets.comperiosearch.com/2011/03/asynchronous-search-results-jquery-solr-json-ajax/

// our namespace
Dezi = {};
Dezi.QUERY = [];

// dynamic file loading from http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
Dezi.load_file = function (filename, filetype){
 if (filetype=="js"){ //if filename is a external JavaScript file
  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript")
  fileref.setAttribute("src", filename)
 }
 else if (filetype=="css"){ //if filename is an external CSS file
  var fileref=document.createElement("link")
  fileref.setAttribute("rel", "stylesheet")
  fileref.setAttribute("type", "text/css")
  fileref.setAttribute("href", filename)
 }
 if (typeof fileref!="undefined")
  document.getElementsByTagName("head")[0].appendChild(fileref)
}


Dezi.search = function(offset) {
   if (!offset) offset = 0;
   var query = $('#q').get(0).value;
   if (!query || !query.length) {
       console.log("no query");
       return;
   }

   var resDiv = $('#results').get(0);
   resDiv.innerHTML = '<div id="progress">...Searching...<br/><img src="http://dezi.org/ui/example/Progress.gif"/></div>'; 
   var uri = DEZI_SEARCH_URI + "?t=JSON&q="+encodeURIComponent(query)+'&o='+offset;   
   console.log(uri);
   $.getJSON(uri+'&f=0', function (resp) {
        resDiv.innerHTML = '';
        //console.log(resp);
        for (var i = 0; i < resp.results.length; i++) {
            var res = resp.results[i];
            var r = "<b><a href='" + DEZI_SEARCH_URI + "/" + res.uri + "'>" + res.title + "</a></b><br/>" + res.summary;
            var $d = $('<div class="result">' + r + '</div>');
            $('#results').append($d);
        }  
        if (!resp.results.length) {
            resDiv.innerHTML = 'No results';
        }
        var start  = parseInt(resp.offset)+1;
        var end    = parseInt(resp.offset)+parseInt(+resp.page_size);
        if (end > resp.total) end = resp.total;
        var $stats = $('<div id="stats">'+start+' - '+end+' of '+resp.total+' results ' +
                       '| Search time: '+resp.search_time+' | Build time: '+resp.build_time+'</div>');
        $('#stats').replaceWith($stats);
        Dezi.pager(resp);
    });
    Dezi.facets(uri);

}

Dezi.append_query = function(q) {
    Dezi.QUERY.push(q);
    Dezi.set_query();
}

Dezi.remove_query = function(q) {
    var newq = [];
    for (var i=0; i<Dezi.QUERY.length; i++) {
        if (Dezi.QUERY[i] == q) {
            continue;
        }
        newq.push(Dezi.QUERY[i]);
    }
    Dezi.QUERY = newq;
    Dezi.set_query();
}

Dezi.get_query_hash = function() {
    var hash = {};
    for (var i=0; i<Dezi.QUERY.length; i++) {
        hash[Dezi.QUERY[i]] = true;
    }
    return hash;
}

Dezi.set_query = function() {
    var qbox = $('#q')[0];
    qbox.value = Dezi.QUERY.join(' AND ');
    var st = $.bbq.getState();
    st['q'] = Dezi.QUERY.join(' AND ');
    $.bbq.pushState(st);
}

Dezi.facet_click = function(cbox) {
    var $checkbox = $(cbox)[0];
    var clause = $(cbox).next().attr('data-facet');
    var fieldname = $(cbox).attr('class');
    if ($checkbox.checked) {
        //console.log("checked!");
        // append facet value to query
        Dezi.append_query(fieldname+'=("'+clause+'")');
    }
    else {
        Dezi.remove_query(fieldname+'=("'+clause+'")');
    }
}

Dezi.facets = function(uri) {
    var facetsDiv = $('#facets').get(0);
    facetsDiv.innerHTML = '<div id="fprogress">...Building...<br/><img src="http://dezi.org/ui/example/Progress.gif"/></div>';
    var MAX_FACETS = 5;

    //console.log("facets uri=", uri+'&f=1&r=0');

    $.getJSON(uri+'&f=1&r=0', function (resp) {
        facetsDiv.innerHTML = '';
        //console.log(resp);
        if (!resp.facets) {
            facetsDiv.innerHTML = 'No facets';
            return;
        }
        var facet_names = [];
        for (var fn in resp.facets) {
            facet_names.push(fn);
        }
        facet_names = facet_names.sort(function(a,b) {
            if (a < b) return -1; // sort alphabetically
            if (b < a) return 1;
            return 0;
        });
        var qhash = Dezi.get_query_hash();
        for (var i=0; i < facet_names.length; i++) {
            var facet_name = facet_names[i];
            var facet = resp.facets[facet_name];
            var f = facet_name + ' (' + facet.length + ')';
            var list = $('<ul></ul>');
            var ordered_facets = facet.sort(function(a,b) {
                if (a.count > b.count) return -1;
                if (a.count < b.count) return 1;
                return 0;
            });
            for (var j=0; j < ordered_facets.length; j++) {
                var fitem = facet[j];
                var fq = facet_name+'=("'+fitem.term+'")';
                //console.log(fq);
                var checked = qhash[fq];
                var label = fitem.label ? fitem.label : fitem.term;
                var checkable = $('<li class="facet"><input class="'+facet_name+'" onclick="Dezi.facet_click(this)" type="checkbox" '+
                                (checked?'checked="true"':'')+
                                '/> <span data-facet="'+fitem.term+'">'+label+'</span> ('+fitem.count+')</li>');
                list.append(checkable[0]);
                if (j >= MAX_FACETS) {
                    break;
                }
            }
            var $d = $('<div class="facet">' + f + '</div>');
            $d.append(list);
            $('#facets').append($d);
        }
    });
}

Dezi.pager = function(resp) {
    var pager_html = $('<div id="pager">' +
      '<a id="pager_m_left"></a><div id="pager_o_left"></div>' +
      '<div class="paginator_p_wrap">' +
        '<div class="paginator_p_bloc">' + '</div>' +
      '</div>' +
      '<div id="pager_o_right"></div><a id="pager_m_right"></a>' +
      '<div id="pager_slider" class="paginator_slider" class="ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all">' +
        '<a class="ui-slider-handle ui-state-default ui-corner-all" href="#"></a>' +
      '</div>' +
     '</div>');

    if ($('#pager').length) {
        $('#pager').replaceWith(pager_html);
    }
    else {
        $('#tools').append(pager_html);
    }
    var this_page = (resp.offset / resp.page_size) + 1;
    $("#pager").jPaginator({
        nbPages: parseInt(resp.total / resp.page_size)+1,
        nbVisible: 10,
        selectedPage: this_page,
        withSlider: true,
        minSlidesForSlider: 2,
        overBtnLeft:'#pager_o_left',
        overBtnRight:'#pager_o_right',
        maxBtnLeft:'#pager_m_left',
        maxBtnRight:'#pager_m_right',
        onPageClicked: function(a,num) {
            var new_offset = resp.page_size * (num - 1);
            var st = $.bbq.getState();
            st['o'] = new_offset;
            $.bbq.pushState(st);
            //Dezi.search(new_offset);
        }
    });
     
}

// generate the page
$(document).ready(function() {
    // load helper files
    Dezi.load_file('http://dezi.org/ui/example/jquery-ui-1.8.13.slider.min.js', 'js');
    Dezi.load_file('http://dezi.org/ui/example/jPaginator.js', 'js');
    Dezi.load_file('http://dezi.org/ui/example/jPaginator.css', 'css');
    Dezi.load_file('http://dezi.org/ui/example/dezi-ui.css', 'css');

    // if we were called with ?q= then initiate query
    var params = $.deparam.querystring();
    //console.log(params);
    var query = "";
    if (params && params.q) {
        query = params.q.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        Dezi.QUERY.push(query);
    }

    // generate page structure
    var $page = $('<div class="title"><a href="https://github.com/karpet/dezi-ui-example">Dezi::UI Example</a>'+
                  ' - part of the <a href="http://dezi.org/">Dezi Search Platform</a></div>'+
                  '<div id="tools"><input size="80" type="text" id="q" value="'+query+'"></input>' +
                   '<button onclick="Dezi.search()">Search</button></div>' +
                  '<div id="stats"></div>' +
                  '<div id="results"></div><div id="facets"></div>');
    $('body').append($page);

    // enter key listener
    $("#q").keyup( function(e) {
        if(e.keyCode == 13) {
            Dezi.QUERY = [];
            Dezi.append_query($('#q')[0].value);
        }
    });

    // let the back button work since we load page via ajax
    $(window).bind( 'hashchange', function(e) {
        //console.log(e.fragment);
        var existing_frag = $.deparam.fragment();
        //console.log(existing_frag);
        if (existing_frag['q'] && existing_frag['q'].length) {
            $('#q')[0].value = decodeURIComponent(existing_frag['q']).replace(/\+/g, ' ');
            Dezi.QUERY = $('#q')[0].value.split(/ AND /);
            Dezi.search(existing_frag['o']);
        }
        else if (query) {
            Dezi.QUERY = [query];
            $('#q')[0].value = query;
            Dezi.search(existing_frag['o']);
        }

    });

    // fire the hashchange trigger on load
    $(window).trigger( 'hashchange' );
        
});

