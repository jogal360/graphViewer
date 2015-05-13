(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else {
		// Browser globals
		root.damasGraph = factory();
	}
}(this, function () {

	// Constructor
	function damasGraph( htmlelem ) {
		this.nodes = [];
		this.links = [];
		this.selection = [];
		this.node_lut = {};
		this.initDebugFrame(htmlelem);
		this.init(htmlelem);
		this.refreshDebugFrame();
	}

	damasGraph.prototype.selectToggle = function( node ) {
		if (this.selection.indexOf(node) === -1 )
		{
			this.selection.push( node );
		}
		else
		{
			this.selection.pop( node );
		}
		node.shape.classList.toggle('selected');
	}

	damasGraph.prototype.load = function( json ){
		var i;
		if(!json.nodes)
		{
			for(i=0;i<json.length;i++)
			{
				var n = json[i];
				if(n.src_id && n.tgt_id)
					this.newEdge(n);
				else
					this.newNode(n);
			}
			return;
		}
		for(i=0;i<json['nodes'].length;i++)
		{
			var n = json['nodes'][i];
			this.newNode(n);
		}
		for(i=0;i<json['links'].length;i++)
		{
			var l = json['links'][i];
			this.newEdge( l );
		}
		return true;
	}

	damasGraph.prototype._newNode = function( node )
	{
                if(node.id && !node._id) node._id = node.id; // backward compatibility
		if (this.node_lut[node._id]) return false;
		this.nodes.push(node);
		this.node_lut[node._id] = node;
		this.refreshDebugFrame();
		return true;
	}

	damasGraph.prototype._newEdge = function( node )
	{
		this.links.push(node);
		this.refreshDebugFrame();
		return true;
	}

	damasGraph.prototype._removeNode = function( node )
	{
		this.selection.pop(node);
		this.nodes.pop(node);
		node.shape.parentNode.removeChild(node.shape);
		this.springy_graph.removeNode( node );
		return true;
	}

	damasGraph.prototype.initDebugFrame = function ( htmlelem )
	{
		this.debug = {};
		var div = document.createElement("div");
		div.setAttribute('id', 'graphDebugFrame' );
		var c = 'DEBUG:<br/><span id="graphDebugNbNodes">?</span> node(s)<br/><span id="graphDebugNbEdges">?</span> edge(s)<br/>';
		div.innerHTML = c;
		this.debug.nbNodes = div.querySelector('#graphDebugNbNodes');
		this.debug.nbEdges = div.querySelector('#graphDebugNbEdges');
		htmlelem.appendChild(div);
	}

	damasGraph.prototype.refreshDebugFrame = function ( )
	{
		if(this.debug.nbNodes)
		{
			this.debug.nbNodes.innerHTML = this.nodes.length;
		}
		if(this.debug.nbEdges)
		{
			this.debug.nbEdges.innerHTML = this.links.length;
		}
	}

	damasGraph.prototype.init_SVG = function ( )
	{
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		svg.setAttribute('id', 'svggraph' );
		svg.setAttribute('viewBox', '0 0 200 200' );
		//var css = document.createElementNS("http://www.w3.org/2000/svg", "style");
		//svg.appendChild(css);
		//css.setAttribute('type', 'text/css' );
		//css.setAttribute('href', 'graph.css' );
		var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		// marker 1
		var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		marker.setAttribute('id', 'arrow' );
		marker.setAttribute('markerWidth', '3' );
		marker.setAttribute('markerHeight', '3' );
		marker.setAttribute('refX', '1.5' );
		marker.setAttribute('refY', '1.5' );
		marker.setAttribute('orient', 'auto' );
		marker.setAttribute('markerUnits', 'strokeWidth' );
		var triangle = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangle.setAttribute('d', 'M0,0 L0,3 L3,1.5 Z' );
		marker.appendChild(triangle);
		defs.appendChild(marker);
		
		// X & Y axes
		var axisX = document.createElementNS("http://www.w3.org/2000/svg", "line");
		axisX.setAttribute('x1', '0' );
		axisX.setAttribute('y1', '0' );
		axisX.setAttribute('x2', '10' );
		axisX.setAttribute('y2', '0' );
		axisX.setAttribute('class', 'axis' );
		svg.appendChild(axisX);
		
		
		var axisY = document.createElementNS("http://www.w3.org/2000/svg", "line");
		axisY.setAttribute('x1', '0' );
		axisY.setAttribute('y1', '0' );
		axisY.setAttribute('x2', '0' );
		axisY.setAttribute('y2', '10' );
		axisY.setAttribute('class', 'axis' );
		svg.appendChild(axisY);
		
//		var center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//		center.setAttribute('cx', '00' );
//		center.setAttribute('cy', '0' );
//		center.setAttribute('r', '1' );
//		center.setAttribute('fill', 'red' );
//		svg.appendChild(center);


		// marker timealert
		var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		marker.setAttribute('id', 'arrowTimealert' );
		marker.setAttribute('markerWidth', '3' );
		marker.setAttribute('markerHeight', '3' );
		marker.setAttribute('refX', '1.5' );
		marker.setAttribute('refY', '1.5' );
		marker.setAttribute('orient', 'auto' );
		marker.setAttribute('markerUnits', 'strokeWidth' );
		var triangle = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangle.setAttribute('d', 'M0,0 L0,3 L3,1.5 Z' );
		marker.appendChild(triangle);
		defs.appendChild(marker);
		var gBox = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		svg.appendChild(defs);
		svg.appendChild(gBox);
		gBox.appendChild(g2);
		gBox.appendChild(g1);
		this.gBox = gBox;
		this.defs = defs;
		this.g2 = g2;
		this.g1 = g1;
		return svg;
	}

damassvggraph = {
	makeSVGinteractive: function() {
		// TEST FOR DROP
		/*
		allowDrop = function(ev){
			ev.preventDefault();
			return false;
		}
		drop = function(ev){
			alert('drop');
			ev.preventDefault();
			//console.log(ev.dataTransfer);
			//console.log(ev.dataTransfer.files[0]);
			console.log(ev.dataTransfer.files);
			var files = ev.dataTransfer.files;
			//alert(files.length);
			for(i=0;i<files.length;i++)
			{
				var file = files[i];
				var elem = damas.create(file);
				elem.update({label: file.name });
				nodes[elem.id] = graph.newNode({'label': file.name});
				nodes[elem.id].damelem = elem;
				//console.log(ev.dataTransfer);
			}
		}
		svg.setAttribute('ondragover', 'allowDrop(event)');
		svg.setAttribute('ondrop', 'drop(event)');
		*/

		function cancel(e){
			e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
			return false; // required by IE
		}
		svg.ondragover = cancel;
		svg.ondragenter = cancel;
/*
		svg.ondragover = function(e){
			e.stopPropagation();
			e.preventDefault();
		}
*/
		svg.ondragleave = function(e){
			e.stopPropagation();
			e.preventDefault();
		}
		svg.ondrop = function(e){
			//alert( e.dataTransfer.getData('Text'));
			e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			//alert('ondrop');
			console.log(e.dataTransfer);
			console.log(e.dataTransfer.files);
			var files = e.dataTransfer.files;

			// DROP FILES
			for(i=0;i<files.length;i++)
			{
				var file = files[i];
				var elem = damas.create(file);
				elem.update({label: file.name });
				nodes[elem.id] = graph.newNode({'label': file.name});
				nodes[elem.id].damelem = elem;
				//console.log(ev.dataTransfer);
			}
			console.log(e.dataTransfer.types);
			var types = e.dataTransfer.types;
			if(e.dataTransfer.types)
			{
				// DROP EXISTING NODE
				var text = e.dataTransfer.getData('Text');
				if( text.indexOf(window.location.origin) === 0)
				{
					id = text.replace(window.location.origin+window.location.pathname+'#view=', '');
					var elem = damas.read(parseInt(id));
					Object.extend( elem, damas.element_canvas );
					var img = elem.imageURL();
					nodes[elem.id] = graph.newNode( { 'elem':elem, 'label': elem.label(), 'damid': elem.id, 'damimg': img } );
					nodes[elem.id].damelem = elem;
				}
				// DROP LINK
				else
				{
					var elem = damas.create( {
						url: e.dataTransfer.getData('Text')
					});
					nodes[elem.id] = graph.newNode({'label': e.dataTransfer.getData('Text')});
					nodes[elem.id].damelem = elem;
				}
			}
		}
		// TEST END
	}
}

	return damasGraph;

}));
