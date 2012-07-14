/* jQuery Dezi::UI example */
// based on http://nuggets.comperiosearch.com/2011/03/asynchronous-search-results-jquery-solr-json-ajax/

function dezi_search() {
   var query = $('#q').get(0).value;
   if (!query || !query.length) {
    return;
   }
   
   var resDiv = $('#rs').get(0);
   resDiv.innerHTML = '...Searching...';  // pretty img
   
   $.getJSON(DEZI_SEARCH_URI + "?q="+query, function (resp) {
        resDiv.innerHTML = '';
        //console.log(resp);
        for (var i = 0; i < resp.results.length; i++) {
            var res = resp.results[i];
            var r = "<b><a href='" + DEZI_SEARCH_URI + "/" + res.uri + "'>" + res.title + "</a></b><br/>" + res.summary;
            var $d = $('<div class="result">' + r + '</div>');
            $('#rs').append($d);
        }  
        if (!resp.results.length) {
            resDiv.innerHTML = 'No results';
        }
    });

}

// generate the page
$(document).ready(function() {
    var params = $.deparam.querystring();
    //console.log(params);
    var query = "";
    if (params && params.q) {
        query = params.q.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }
    var $page = $('<div><input type="text" id="q" value="'+query+'"></input><button onclick="dezi_search()">Search</button></div><div id="rs"></div>');
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

