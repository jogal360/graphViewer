(function (root, factory) {
        if (typeof define === 'function' && define.amd) {
                // AMD. Register as an anonymous module.
                define(['graph-common', 'd3'], factory);
        } else {
                // Browser globals
                root.damasGraph = factory(root.damasGraph, root.d3);
        }
}(this, function (damasGraph, d3) {

	//damasGraph.prototype.node_lut = {};

	damasGraph.prototype.init = function ( htmlelem )
	{
		this.svg = this.init_SVG();

		var width = window.innerWidth;
		var height = window.innerHeight;
		htmlelem.appendChild(this.svg);

		svg = d3.select("#svggraph")
			.attr("viewBox", "0 0 " + width + " " + height )
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr("pointer-events", "all")
			.call(d3.behavior.zoom().on("zoom", rescale));

		this.defs = d3.select("defs");
		var gBox = d3.select(this.gBox).attr("pointer-events", "all");

		function rescale() {
			trans=d3.event.translate;
			scale=d3.event.scale;
			gBox.attr("transform",
			"translate(" + trans + ")"
			+ " scale(" + scale + ")");
		}

		this.force = d3.layout.force()
			.charge(-200)
			.linkDistance(30)
			.size([width, height])
			.nodes([])
			.links([]);

		this.d3_nodes = [];
		this.d3_links = [];


		this.drag = function()
		{	d3.behavior.drag()
			return this.force.drag()
			.on("dragstart", dragstarted)
			.on("drag", dragged)
			.on("dragend", dragended);
		}

		function dragstarted(d) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
			//graph.force.start();
		}

		function dragged(d) {
			d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
		}

		function dragended(d) {
			d3.select(this).classed("dragging", false);
		}

//		this.svgNodes = this.g1.selectAll('g');
//		this.svgLinks = this.g2.selectAll('path');
		this.svgNodes = d3.select(this.g1).selectAll('g');
		this.svgLinks = d3.select(this.g2).selectAll('path');
		this.force.on("tick", this.tick);


		this.refreshDebugFrame(htmlelem);
	}

	damasGraph.prototype.init_SVG2 = function ( htmlelem )
	{
		var color = d3.scale.category20();

		var width = window.innerWidth;
		var height = window.innerHeight;

		svg = d3.select("#graph")
			.append("svg:svg")
				.attr("id", "svggraph")
				.attr("viewBox", "0 0 " + width + " " + height )
				.attr("preserveAspectRatio", "xMidYMid meet")
				.attr("pointer-events", "all")
				.call(d3.behavior.zoom().on("zoom", rescale));
//				.on("mousedown", mousedown);

		this.defs = svg.append('svg:defs');

		var gBox= svg.append('svg:g')
				.attr("pointer-events", "all");

		function rescale() {
			trans=d3.event.translate;
			scale=d3.event.scale;
			gBox.attr("transform",
			"translate(" + trans + ")"
			+ " scale(" + scale + ")");
		}

		this.g1 = gBox.append('svg:g');
		this.g2 = gBox.append('svg:g');
		return svg[0][0];
	}

	damasGraph.prototype.newNode = function ( node )
	{
		if( this._newNode(node) )
		{
			this.d3_nodes.push(JSON.parse(JSON.stringify(node)));
			this.restart();
			return true;
		}
		return false;
	}

	damasGraph.prototype.newEdge = function ( link )
	{
		function search_node(id){
			for( var i=0; i< graph.d3_nodes.length; i++){
				if (graph.d3_nodes[i]._id === id)
					return graph.d3_nodes[i];
			}
		}
		if (this._newEdge(link))
		{
			this.d3_links.push({
				id: link._id,
//				id: this.node_lut[link._id],
				source: search_node(link.src_id),
				target: search_node(link.tgt_id)
			});
			this.restart();
			return true;
		}
		return false;
	}

	damasGraph.prototype.getShape = function( node )
	{
		return node.shape;
	}

	damasGraph.prototype.restart = function ()
	{

		this.force.nodes(this.d3_nodes);
		this.force.links(this.d3_links);
		// add new nodes
		this.svgNodes = this.svgNodes.data( this.d3_nodes, function(d){
			return (d.id)? d.id : d._id;
		});
		
		var g = this.svgNodes.enter().append('svg:g').call(graph.force.drag()
				.on("dragstart", function(d){ d3.event.sourceEvent.stopPropagation(); })
				.on("drag", function(d) { graph.drag(); }));
		
		g.append("circle")
			.attr("r", 10)
			.attr("class", function(d){ d.shape = this; return "nodeBG"});

		g.append('svg:circle')
			.attr("id", function(d) { return "thumb"+d._id; })
			.attr("r", 10)
			.attr("fill", function(d) {
				return (d.id)? "url(#thumbPat"+d.id+")" : "url(#thumbPat"+d._id+")";
			})
			.attr("class", "node");
//		g.append('svg:image')
//			.attr('id', function(d) { return "thumb"+d.id; })
//			.attr('xlink:href', function(d) {return  thumbnail(d);})
//			.attr('x', '0')
//			.attr('y', '0');
		g.append('svg:text')
			.attr("class", "label")
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text(function(d) {
				return (d.file)? d.file.split('/').pop() : d._id;
			});
//				.text(function(d) { return d.id });
//				.style("stroke", "white");
		g.append('svg:text')
			.attr("class", "extText")
			.attr('text-anchor', 'middle')
			.attr("dx", 0)
			.attr("dy", 2)
			.text(function(d) {
				if("file" in d  && !("image" in d))
				{
					return d.file.split(".").pop().toUpperCase();
				}
				else if("keys" in d)
				{
					if("file" in d.keys && !("image" in d.keys))
					{
						return d.keys.file.split(".").pop().toUpperCase();
					}
				}});
		g.append("a")
			.attr('xlink:href', function(d) {
				return (d.id)? '#'+d.id : '#'+d._id;
			});

		g.on("click", function(d) {
			if (d3.event.defaultPrevented) return; // click suppressed
			//assetOverlay(d);
			if(window['node_pressed']){
				node_pressed.call(graph.node_lut[d._id], d3.event);
			}
		});
		
		var patImage = this.defs.selectAll("pattern")
			.data(this.nodes)
			.enter().append('svg:pattern')
			.attr('patternContentUnits', 'objectBoundingBox')
			.attr('id', function(d) {
				return (d.id)? "thumbPat"+d.id : "thumbPat"+d._id;
			})
			.attr('x', '0')
			.attr('y', '0')
			.attr('width', 1)
			.attr('height', 1);

		var image = patImage.append('image')
			.attr('id','thumbnail')
			.attr('xlink:href', function(d) {
				return (d.keys)? d.keys.image : d.image;
			})
			.attr('x', '0')
			.attr('y', '0')
			.attr('width', 1)
			.attr('height', 1);
//			.attr('preserveAspectRatio', 'xMidYMid slice');
		
//		image.attr('xlink:href', function(d) {
//				return  thumbnail(d);
//			});
		
		var tools = g.append('svg:g')
			.attr("class", "tools")
			.style('opacity', '0');
		
		var toolsBGCircle = tools.append("circle")
			.attr('r', 17)
			.attr('cx', '0')
			.attr('cy', '0')
			.style('opacity', '0');
		
		var openCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-10')
			.attr('cy', '10')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var shareCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-14')
			.attr('cy', '0')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var deleteCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-10')
			.attr('cy', '-10')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var openPlus = tools.append("svg:image")
			.attr('xlink:href', 'scripts/graphViewer/icons/plus25.svg')
			.attr("class", "openPlus")
			.attr('x', '-12')
			.attr('y', '8')
			.attr('width', 4)
			.attr('height', 4);

		g.on("mouseover", function(d) {
			var nodeSelection = d3.select(this);
			nodeSelection.select('g').style({opacity:'1.0'});
		});
		g.on("mouseout", function(d) {
			var nodeSelection = d3.select(this);
			nodeSelection.select('g').style({opacity:'0.0'});
		});

		//damasGraph.svgNodes.append("title")
			//.text(function(d) { return d.type; });

		//g.call(this.force.drag);

		// add new links

		this.svgLinks = this.svgLinks.data(this.d3_links);
//		this.svgLinks = this.svgLinks.data( this.links, function(l){ return l.id });
		var lin = this.svgLinks.enter().append("svg:path")
			.attr("class", "link")
			.style("marker-end",  "url(#arrow)")
			.style("stroke-width", '1');
		
		lin.on("click", function(l) {
			if (d3.event.defaultPrevented) return; // click suppressed
			//assetOverlay(d);
			if(window['node_pressed']){
//				node_pressed.call(graph.node_lut[l._id], d3.event); // TODO
			}
		});
		

		this.force.start();
	}
	damasGraph.prototype.tick = function ( )
	{
		graph.svgLinks.attr('d', function(d) {
		    var deltaX = d.target.x - d.source.x,
		        deltaY = d.target.y - d.source.y,
		        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
		        normX = deltaX / dist,
		        normY = deltaY / dist,
		        sourcePadding = d.left ? 17 : 10.5,
		        targetPadding = d.right ? 17 : 12,
		        sourceX = d.source.x + (sourcePadding * normX),
		        sourceY = d.source.y + (sourcePadding * normY),
		        targetX = d.target.x - (targetPadding * normX),
		        targetY = d.target.y - (targetPadding * normY);
		    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
		});
		graph.svgNodes.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		});
/*
		circ.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });

		openPlus.attr("x", function(d) { return (d.x) + 5; })
			.attr("y", function(d) { return (d.y) + 5; });
			
		d3.selectAll("text").attr("x", function (d) { return d.x; })
			.attr("y", function (d) { return d.y; });
*/
	}
	return damasGraph;
}));
