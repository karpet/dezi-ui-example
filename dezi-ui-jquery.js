/* jQuery Dezi::UI example */
// based on http://nuggets.comperiosearch.com/2011/03/asynchronous-search-results-jquery-solr-json-ajax/


// dynamic file loading from http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
function loadjscssfile(filename, filetype){
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


function dezi_search(offset) {
   if (!offset) offset = 0;
   var query = $('#q').get(0).value;
   if (!query || !query.length) {
    return;
   }
   
   var resDiv = $('#results').get(0);
   resDiv.innerHTML = '<div id="progress">...Searching...<br/><img src="http://dezi.org/ui/example/Progress.gif"/></div>'; 
   var uri = DEZI_SEARCH_URI + "?q="+query+'&o='+offset;   
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
        dezi_pager(resp);
    });
    dezi_facets(uri);

}

function dezi_facets(uri) {
    var facetsDiv = $('#facets').get(0);
    facetsDiv.innerHTML = '<div id="fprogress">...Building...<br/><img src="http://dezi.org/ui/example/Progress.gif"/></div>';

    $.getJSON(uri+'&f=1&r=0', function (resp) {
        facetsDiv.innerHTML = '';
        console.log(resp);
        if (!resp.facets) {
            facetsDiv.innerHTML = 'No facets';
            return;
        }
        for (var facet_name in resp.facets) {
            var facet = resp.facets[facet_name];
            var f = facet_name + ' (' + facet.length + ')';
            var $d = $('<div class="facet">' + f + '</div>');
            $('#facets').append($d);
        }
    });
}

function dezi_pager(resp) {
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
            dezi_search(new_offset);
        }
    });
     
}

// generate the page
$(document).ready(function() {
    // load helper files
    loadjscssfile('http://dezi.org/ui/example/jquery-ui-1.8.13.slider.min.js', 'js');
    loadjscssfile('http://dezi.org/ui/example/jPaginator.js', 'js');
    loadjscssfile('http://dezi.org/ui/example/jPaginator.css', 'css');
    loadjscssfile('http://dezi.org/ui/example/dezi-ui.css', 'css');

    // if we were called with ?q= then initiate query
    var params = $.deparam.querystring();
    //console.log(params);
    var query = "";
    if (params && params.q) {
        query = params.q.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    // generate page structure
    var $page = $('<div id="tools"><input size="30" type="text" id="q" value="'+query+'"></input>' +
                   '<button onclick="dezi_search()">Search</button></div>' +
                  '<div id="stats"></div>' +
                  '<div id="results"></div><div id="facets"></div>');
    $('body').append($page);

    if (query.length) {
        dezi_search();  // q present, start search
    }

    // enter key listener
    $("#q").keyup( function(e) {
        if(e.keyCode == 13) {
            dezi_search();
        }
    });
});

