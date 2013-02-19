var colorLegendPointer,
  updatePointer,
  legendScale = d3.scale.linear(),
sizeAxis,
titleText;
var 	nameSubstitutions={
	    "WordsPerMillion":"Uses per Million Words",
	    "WordCount":"# of matches",
	    "TextPercent":"% of texts",
	    "TotalWords":"Total # of words",
	    "TextCount":"# of Texts",
	    "TotalTexts":"Total # of Texts"
	}


console.log("trying to load")
updatePointer = function() {console.log("updatePointer is undefined")}

fillLegendMaker = function(colorscale) {
    var yrange = [0,h*.75]
    colorticks = colorscale.ticks(15);

    width = 25
    plot = true
    colorpoints = colorLegend.selectAll('rect')
    colorlabels = colorLegend.selectAll('text')

    function my() {
	var data1 = d3.range(yrange[0],yrange[1]);

	scaleRects = colorLegend.selectAll("rect")
	    .data(data1,function(d){return(d)});

	legendScale=colorscale.copy()
	legendScale.range(d3.range(yrange[0],yrange[1]+yrange[1]*.001,by=(yrange[1]-yrange[0])/(legendScale.domain().length-1)))
	
	scaleRects.enter()
	    .append("rect")
	    .attr({
		width: width,
		height:1,
		y: function(d) { return d},
		fill: function(d) {
		    return colorscale(legendScale.invert(d));
		}
	    })

	scaleRects.exit().remove()

	//'formatter' pretties the name, and drops certain ticks for 
	// a log scale.
	function formatter(d) {
	    var x = Math.log(d) / Math.log(10) + 1e-6;
	    return Math.abs(x - Math.floor(x)) < .7 ? prettyName(d) : "";
	}
	
	if ($('#scaleType').val() != "log") {
	    formatter=prettyName
	}
	
	d3.selectAll("#color-axis").remove()
	
	colorAxis = d3.svg.axis()
	    .scale(legendScale)
	    .orient("right")
	    .tickFormat(formatter)

	colorLegend.selectAll('text').remove()
	
	colorLegend.append("g")
            .attr('id','color-axis')
            .call(colorAxis)
            .attr("class","axis") // note new class name
	    .attr("transform","translate (" + (width) + ",0)") 
	

	writeTitle = function() {
	    //Figure out what they're trying to plot, for the title.
	    //starredKeys are the numerator in a ratio query.
	    starredKeys = d3.keys(query['search_limits']).filter(function(d) {
		return d.search("\\*") > 0
	    })

	    if (starredKeys.length==0) {starredKeys=["word"]}
	    
	    text1 = starredKeys.map(function(key) {

	    values = query['search_limits'][key].join('"/"')
		var pretty = key.replace("\*","")
		console.log(pretty)
		return pretty + ' "' +values + '"'
	    }).join(' and ')


	    text1 = "Share of " + text1
	    if (query['plotType']!="map") {
		text1 = text1.replace("Share","Usage") +  " by " + query['groups'].join(' and ')
	    }
	    
	    if (comparisontype()=='comparison') {
		text1 = "Usage of '" + query['search_limits']['word'][0] + "'" + " per use of '" + query['compare_limits']['word'][0] + "'"
            }
	    title.selectAll('text').remove()
	    title
		.append('text')
		.attr('text-anchor','middle')
		.text(text1)
		.attr('fill','white')
		.attr('font-size',35)
		.attr('font-family',"Arial")
		.attr('transform','translate(10,0)')
	}

	writeTitle()

	colorLegend.append('text')
	    .attr('transform','translate (0,-10)')
	    .attr('class','axis')
	    .text(nameSubstitutions[aesthetic['color']])
	    .attr('fill','white')
	    .attr('font-size','12')
	    .attr('text-anchor','middle')
	    .attr('font-family','sans-serif')

	//set up pointer
	
	d3.selectAll('#pointer').remove()
	
	console.log("Trying to set up pointer")

	//The pointer is 14 pixels wide. That's what all the 14s here are doing.
	colorLegendPointer = colorLegend
	    .append('path')
	    .attr('id','pointer')
	    .attr('d', function(d) { 
		var y = 0, x = width-14;
		return 'M ' + x +' '+ y + ' l 14 14 l -14 14 z';
	    })
	    .attr('fill','grey')
	    .attr("transform","translate(0," + 200 + ")") //can start wherever
	    .attr("opacity","0") //Start invisible: mouseover events will turn it on.

	updatePointer=function(inputNumbers) {
	    colorLegendPointer
		.transition()
		.duration(750)
		.attr('opacity',1)
		.attr('transform',"translate(0," + (legendScale(inputNumbers) -14)+ ')')
	}
    }
    
    my.yrange = function(value) {
        if (!arguments.length) return yrange;
        yrange = value;
        return my;
    };

    return my
}



drawSizeLegend = function() {
    sizeLegend.selectAll('text').remove()
    sizeLegend.selectAll('circle').remove()

    sizeAxis = d3.svg.axis().scale(sizescale).orient("right").tickValues(function() {
	nestedScale = d3.scale.linear().range(nwords.range()).domain(nwords.range());
	nestedScale.nice();
	return nestedScale.ticks(6).map(function(n) {return nwords.invert(n)})
    }).tickFormat(prettyName)

    sizeLegend.append('g').attr('id','size-axis').call(sizeAxis).attr('class','axis')

    sizescale.ticks(6)
    
    sizeLegendPoints = sizeLegend.selectAll('circle').data(sizeAxis.tickValues()())
    
    sizeLegendPoints.enter().append('circle')
	.attr('r',function(d) {return nwords(d)/2 })
	.attr('class','axis')
	.attr('stroke','white')
	.attr('fill','white')
	.attr('opacity',.2)
	.attr('transform',function(d) {
	    return('translate(0,' + nwords(d)/2+')')
	})
    
    sizeLegend
	.append('text')
	.attr('transform','translate(0,-10)')
	.attr('class','axis')
	.text(nameSubstitutions[aesthetic['size']])
	.attr('fill','white')
	.attr('font-size','12')
	.attr('font-family','sans-serif')
	.attr('text-anchor','middle')
}
