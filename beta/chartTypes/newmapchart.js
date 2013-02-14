function mapQuery() {

    var myQuery = query

    var baseMap = drawMap(document.getElementById('mapChoice').value)
    var initialOpacity = .7
    var additionalGroupings = [] //allow multiple circles on the same point?

    var colorScaler = returnScale()
    var sizeScaler  = returnScale()

    var sizeVariable = 'WordCount'

    function mapTransition() {
//        paperdiv.selectAll('text').attr('filter','url(#blur)')
//        filter.transition().duration(2500).attr('stdDeviation',8)
                paperdiv.selectAll('circle')
                    .transition()
                    .duration(4500)
                    .attr('r',2)
                    .attr('fill','white');
    }

    function updateChart() {

	paperdiv.selectAll('title').remove()
        paperdata.sort(function(a,b) {return(b[sizeVariable]-a[sizeVariable])} );
	
        var mypoints = paperdiv.selectAll('circle')
            .data(paperdata,function(d) {return([d.lat,d.lng])});
	
        //filter.transition().duration(750).attr('stdDeviation',0)
	
        mypoints
            .enter()
            .append('circle')

	mypoints
            .on('click',function(d) {
                searchTemplate = JSON.parse(JSON.stringify(query))
                searchTemplate['search_limits']['lat'] = [d.lat]
                searchTemplate['search_limits']['lng'] = [d.lng]
                searchWindow(searchTemplate)
            });
	
        mypoints
            .attr('transform',function(d) {
                coords = projection([d.lng,d.lat]);
                return "translate(" + coords[0] +","+ coords[1] + ")"})
            .attr('id',function(d) {return(d.paperid)})
            .attr('opacity',initialOpacity)
            .attr('onmouseover', "evt.target.setAttribute('opacity', '1');")
            .attr('onmouseout',  "evt.target.setAttribute('opacity', " + initialOpacity + ");")
            .transition()
            .duration(2500)
            .attr('r',function(d) {
                return nwords(d[sizeVariable])
            })
            .attr('fill',function(d) {
                if (comparisontype()=='comparison') {return(colorscale(d.WordCount/d.CompareWords))}
                else {return(colorscale(d.WordCount/d.TotalWords*1000000))}
            })
	
        mypoints.append("svg:title")
            .text(function(d) {return ('Click to read texts from here\n (' +prettyName(d.WordCount) + ' occurences out of ' + prettyName(d.TotalWords) + ' total words)')})

        mypoints.exit().transition().duration(2500).attr('r',0).remove()
	
        fillLegend=fillLegendMaker(colorscale)
        fillLegend()
	
        makeSizeLegend();
        //svg.selectAll('text').attr('filter','url(#blur)')
    }
    
    my.updateChart=updateChart

    function my() {
        mapTransition()
        query["groups"]=["lat","lng"].concat(additionalGroupings)
        if (lastPlotted != 'map') {
            lastPlotted = 'map'
            removeElements()
        }
        projection = baseMap()
        updateQuery()
        webpath = destinationize(query);
        d3.json(webpath,function(json) {
            paperdata = parseBookwormData(json,query);
            if (comparisontype()=='comparison') {
                paperdata = paperdata.map(function(d) {d.CompareWords = d.TotalWords; d.TotalWords = d.WordCount+d.TotalWords;return(d)})
            }
            values = paperdata.map(function(d) {return(d.WordCount/d.TotalWords)});
            if (comparisontype()!='comparison') {
                values = paperdata.map(function(d) {return(d.WordCount/d.TotalWords*1000000)});
            }

            colorscale = colorScaler.values(values).scaleType(d3.scale[$("#scaleType").val()])()

            sizes = paperdata.map(function(d) {return(d[sizeVariable])});

            nwords.domain(d3.extent(sizes))
                .range([0,40])
	    
            nwords.nice()
            updateChart()
        })
    }
    
    my.initialOpacity = function(value) {
	if (!arguments.length) return initialOpacity;
	initialOpacity = value;
	return my;
    };

    my.colorScaler = function(value) {
	if (!arguments.length) return colorScaler;
	colorScaler = value;
	return my;
    };
    
    my.baseMap = function(value) {
	if (!arguments.length) return baseMap;
	baseMap = value;
	return my;
    };
    return my
}