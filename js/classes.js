// Keeps track of changes and handles undo
var Stack = {
	actions: [],
	map: null,
	start: function() {
		if(this.map == null)
		{
			this.map = new Map();	
		}
	},
	draw: function(map, x, y) {
		var newMap = map.getFrom(preview_map, x, y);
		this.map.overrideWith(newMap, x, y, false);
	},
	stop: function() {
		this.actions.push(this.map);
		this.map = null;
		this.startx = 0;
		this.starty = 0;
	},
	get : function() {
		return this.map;	
	},
	undo: function(canvas) {
		if(this.actions.length > 0)
		{
			var selected = parseInt($('.layer-list.ui-selected').attr('layer'));
			var map_ref = this.actions.pop();
			var map = map_ref.get();
			var ctx = canvas.getContext("2d");

			Map.layers[selected].overrideWith(map_ref, 0, 0, false);
			var map = Map.layers[selected].get();
			ctx.clearRect(0, 0, tmx.map.width*tmx.map.tilewidth, tmx.map.height*tmx.map.tileheight);
			for(var yv in map)
			{
				yv = parseInt(yv);
				for(var xv in map[yv])
				{
					xv = parseInt(xv);
					var drawx = (xv*tmx.map.tilewidth);
					var drawy = (yv*tmx.map.tileheight);
					if(map[yv][xv] != 0)
					{
						var real_canvas = canvases[canvases_arr[map[yv][xv]-1]];
						ctx.drawImage(real_canvas.canvas, drawx, drawy);
					}
				}
			}
		}
	}
}

// Keeps an internal representation of the tile layers
function Map() {
	this.map = [];

	this.init = function(w, h) {
		this.map = new Array(h);
		for(var i=0;i<h;i++) 
		{
			this.map[i] = new Array(w);
		}
	}

	this.set = function(tile, x, y) {
		this.map[y][x] = tile;
	}

	this.addTo = function(val, x, y) {
		if(typeof(this.map[y]) == 'undefined')
		{
			this.map[y] = [];
		}
		this.map[y][x] = val;
	}

	this.get = function() {
		return this.map;
	}

	this.getFrom = function(map_ref, x, y) {
		var ax = Math.round(x/tmx.map.tilewidth);
		var ay = Math.round(y/tmx.map.tileheight);
		
		var map = map_ref.get();
		var retval = new Map();
		for(var yv in map)
		{
			yv = parseInt(yv);
			for(var xv in map[yv])
			{
				xv = parseInt(xv);
				retval.addTo(this.map[ay+yv][ax+xv], ax+xv, ay+yv);
			}
		}
		return retval;
	}

	this.print = function(val) {
		if(typeof(val) != 'undefined')
		{
			console.log(val);
		}
		var str = "";
		for(var y in this.map)
		{
			str += y+":";
			for(var x in this.map[y])
			{
				str += x+":"+this.map[y][x]+", ";
			}
			str += "\n";
		}
		console.log(str);
	}

	this.printOnly = function(val) {
		if(typeof(val) != 'undefined')
		{
			console.log(val);
		}
		var str = "";
		for(var y in this.map)
		{
			for(var x in this.map[y])
			{
				str += this.map[y][x]+",";
			}
			str += "\n";
		}
		console.log(str);
	}

	this.overrideWith = function(map_ref, x, y, offset) {
		var ax = Math.round(x/tmx.map.tilewidth);
		var ay = Math.round(y/tmx.map.tileheight);

		var map = map_ref.get();
		for(var yv in map)
		{
			yv = parseInt(yv);
			for(var xv in map[yv])
			{
				this.addTo(map[yv][xv], (offset?ax:0)+parseInt(xv), (offset?ay:0)+yv);
			}
		}
	}
}