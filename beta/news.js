//There should always be a query variable present: from that, it should be possible to derive anything else we'll ever need, and any changes can update it directly.

var query = {
    "method":"return_json",
    "words_collation":"Case_Sensitive",
    "groups":["paperid","lat","lng"],
    "database":"ChronAm",
    "counttype":["WordCount","TotalWords"],
    "search_limits":{
	"date_year":{"$lte":1922,"$gte":1850},
	"word":["Ohio river"]
    }
};

var queryBox = $('<div />');
$('<input />').attr("id", "word_box").val(query['search_limits']['word'][0]).appendTo(queryBox);
// clear below
$('<input />').attr("id", "word_box2").val('').appendTo(queryBox);
$('<input />').attr("id", "year1_box").val(query['search_limits']['date_year']['$gte']).appendTo(queryBox);
$('<input />').attr("id", "year2_box").val(query['search_limits']['date_year']['$lte']).appendTo(queryBox);
$('<button />').text('Submit').click(function(){runQuery();}).appendTo(queryBox);
$('<span />').attr("id", "max_x").appendTo(queryBox);
queryBox.appendTo($('body'));


$('body').keypress(function(e){
    if(e.which == 13){
        runQuery();
    }
});

//can this be cut?
//var data; // loaded asynchronously

var svg = d3.select("#chart")
    .append("svg")
    .attr("background","black")

// Make the background map

var projection = d3.geo.albersUsa()
    .translate([700,350])
    .scale([1500]);

var path = d3.geo.path()
    .projection(projection);

var states = svg.append("g")
    .attr("id", "states");

d3.json("../data/us-states.json", function(json) {
    states.selectAll("path")
        .data(json.features)
      .enter()
	.append("path")
        .attr("d", path)
        .attr('fill',"grey")
});


// Prepare the paper points.
var paperdiv = svg.append("g").attr("id","paperdiv");

var paperdata = [];

var paperpoints = paperdiv
    .selectAll("circle")
    .data(paperdata,key)

//paperpoints
//  .enter()
  //  .append('circle')
 //   .attr('id',function(d) {return(Math.random()*1000)})
 //   .attr('cx',function(d) {return(Math.random()*1000)})
 //   .attr('cy',300)
  //  .attr('fill','red')
 //   .attr('r',15)
//    .attr('opacity',.2)


// Make the d3 scales

//colors = d3.scale.sqrt().range(["rgb(254,249,240)","rgb(246,188,91)","rgb(209,35,11)"])
colors = d3.scale.sqrt().range(["white","yellow","red"]);
logcolors = d3.scale.log().range(['green','white','red']);
transparency = d3.scale.sqrt().range([0,1]);
nwords = d3.scale.sqrt().range([3,25]);

function key(d) {return d.key;};

function popitup(url) {
    newwindow=window.open(url,'name','height=640,width=1000');
    if (window.focus) {newwindow.focus()}
    return false;
}

function destinationize(query) {
    return( "http://arxiv.culturomics.org/cgi-bin/dbbindings.py/?queryTerms=" + encodeURIComponent(JSON.stringify(query)))
};

function parseBookwormData(json,query) {
    //this parses any Bookworm json into a nice set of objects that should be easily plottable. One point per object, though, rather than a path.
    names = [].concat(query.groups).concat(query.counttype);
    function flatten(example) {
	return(
            Object.keys(example).map(function(key) {
		if (example[key] instanceof Array)
		{
                    return([key].concat(example[key]))} 
		else {
		    return(
			[key].concat(flatten(example[key])[0])
		    )}
            })
	)
    };
    
    function toObject(names, values) {
	var result = {};
	for (var i = 0; i < names.length; i++) {
            result[names[i]] = values[i];}
	return result;
    };
    
    flat = flatten(json);
    
    results = flat.map(function(localdata){
	return(toObject(names,localdata));
    })

    return results

}

var comparetype = 'absolute';

function runQuery() {
    paperdiv.selectAll('circle')
	.transition()
	.duration(2500)
	.attr('r',.1)
	.attr('fill','grey');
    
    colorscale = colors;
    query['search_limits']['word'] = [$("#word_box").val()];
    query['search_limits']['date_year']['$gte'] = parseInt($("#year1_box").val());
    query['search_limits']['date_year']['$lte'] = parseInt($("#year2_box").val());
   
    if ($("#word_box2").val().length) {
	comparetype = 'comparison';
	colorscale  = logcolors;
	query['compare_limits'] = {};
	query['compare_limits']['date_year'] = {};
	query['compare_limits']['word'] = [$("#word_box2").val()];
	query['compare_limits']['date_year']['$gte'] = parseInt($("#year1_box").val());
	query['compare_limits']['date_year']['$lte'] = parseInt($("#year2_box").val());
    }

    webpath = destinationize(query);
    console.log(webpath);

    d3.json(webpath,function(json) {
	
	paperdata = parseBookwormData(json,query);

	values = paperdata.map(function(d) {return(d.WordCount/d.TotalWords)});
	totals = paperdata.map(function(d) {return(d.TotalWords)});

	maxcolors = d3.max(values)

	colorscale.domain([d3.min(values),(Math.sqrt(maxcolors)/2)*(Math.sqrt(maxcolors)/2),maxcolors])

	if (comparetype=='comparison') {
	    colorscale.domain([d3.max([d3.min(values),1/10000]),1,d3.min([d3.max(values),10000])]);
	}

	nwords.domain(d3.extent(totals))
	transparency.domain(nwords.domain());

	$("#max_x").text(' maximum value: ' + Math.round( 100*1000000*colors.domain()[2],2)/100 );
	
	paperdiv.selectAll('circle').remove()

	//stupid, but don't want to change the underlying function.
	searchTemplate = {"search_limits" : [JSON.parse(JSON.stringify(query['search_limits']))]}

	
	paperpoints
	    .data(paperdata,function(d) {return(d.paperid)})
	    .enter()
	  .append('circle')
	    .on('click',function(d) {
		searchTemplate['search_limits'][0]['paperid'] = [d.paperid]

//		popitup('http://chroniclingAmerica.loc.gov/lccn/' + d.paperid + '/')
		popitup('http://arxiv.culturomics.org/ChronAm/#?' + encodeURIComponent(JSON.stringify(searchTemplate)))
	    })
	    .attr('fill','grey')
	    .attr('transform',function(d) {
		coords = projection([d.lng,d.lat]);
		return "translate(" + coords[0] +","+ coords[1] + ")"})
	    .attr('id',function(d) {return(d.paperid)})
	    .attr('opacity','.5')
	    .attr('onmouseover', "evt.target.setAttribute('opacity','1');")
	    .attr('onmouseout',  "evt.target.setAttribute('opacity','.5');")
	  .transition()
	    .duration(2500)
	    .attr('r',function(d) {return(nwords(d.TotalWords))})
	    .attr('fill',function(d) {return(colorscale(d.WordCount/d.TotalWords))})

	paperpoints.sort(function(d) {return(d.value)} );
	paperpoints.exit().remove()
    });
}

runQuery()