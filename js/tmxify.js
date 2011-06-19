/******************************************************************************
* Loading functions
*/
var selected = $([]), offset = {top:0, left:0};
var tile_preview = true;
// Parse through the loaded TMX map
function loadMap()
{
	var width = tmx.map.width*tmx.map.tilewidth;
	var height= tmx.map.height*tmx.map.tileheight;
	Map.layers = [];
	// Load map
	for(var i=0;i<tmx.layers.length;i++)
	{
		map.append('<div class="layer" id="layer'+i+'" style="width:'+width+'px;height:'+height+'px"></div>');
		var layer = $('#layer'+i)
		// Load a specific tile section
		if(typeof tmx.layers[i]['tiles'] != 'undefined' && tmx.layers[i]['tiles'].length > 0)
		{
			var canvas = document.createElement('canvas');
			canvas.id = "canvas"+i;
			canvas.width = width;
			canvas.height = height;
			var ctx = canvas.getContext("2d");
			var id = 0;
			Map.layers[i] = new Map();
			Map.layers[i].init(tmx.map.width, tmx.map.height);
			for(var y=0;y<tmx.map.height;y++)
			{
				for(var x=0;x<tmx.map.width;x++)
				{
					id++;
					var tile_number = tmx.layers[i]['tiles'][y][x];
					Map.layers[i].set(tile_number, x, y);
					if(tile_number > 0)
					{
						var real_canvas = canvases[canvases_arr[tile_number-1]];
						ctx.drawImage(real_canvas.canvas, x*tmx.map.tilewidth, y*tmx.map.tileheight);
					}
				}
			}
			layer.append(canvas);
		}
		// Load a Tile Object
		else if(typeof tmx.layers[i]['object'] != 'undefined' && tmx.layers[i]['object'].length > 0)
		{
			var color = tmx.layers[i]['color'];
			for(var o=0;o<tmx.layers[i]['object'].length;o++)
			{
				var object = tmx.layers[i]['object'][o];
				var width = typeof object.width == 'undefined' ? tmx.map.tilewidth : object.width;
				var height = typeof object.height == 'undefined' ? tmx.map.tileheight : object.height;
				var gid = typeof object.gid == 'undefined' ? '' : object.gid;
				var objectid = 'object_'+i+'_'+o;
				var backgroundImage = '';
				layer.append('<div class="object" gid="'+gid+'" id="'+objectid+'"></div>');
				
				// Lookup reference to tileset object
				if(gid != '' && (tileset = $('canvas[gid='+gid+']')))
				{
					width = tileset.width();
					height = tileset.height();
					object.y -= parseInt(height);
					var context = document.getElementById(tileset.attr('id'));
					backgroundImage =  "url("+context.toDataURL("image/png")+")";
				}

				$('#'+objectid).css({
					'border-color':color,
					'left':object.x+'px',
					'top':object.y+'px',
					'width':width+'px',
					'height':height+'px',
					'background-image':backgroundImage
				})
				.resizable({handles:'se', grid:[tmx.map.tilewidth,tmx.map.tileheight]})
				.draggable({
					distance: 5,
					grid: [tmx.map.tilewidth,tmx.map.tileheight],
					start: function(ev, ui) {
						$(this).is(".ui-selected") || $(".ui-selected").removeClass("ui-selected");
						
						selected = $(".ui-selected").each(function() {
							var el = $(this);
							el.data("offset", el.offset());
						});
						offset = $(this).offset();
					},
					drag: function(ev, ui) {
						var dt = ui.position.top - offset.top, dl = ui.position.left - offset.left;
						
						// take all the elements that are selected expect $("this"), which is the element being dragged and loop through each.
						selected.not(this).each(function() {
							var el = $(this), off = el.data("offset");
							el.css({top: off.top + dt, left: off.left + dl});
							
					    });
					}
				})
				.click(function(event){
					if(!event.ctrlKey)
					{
						$('.ui-selected').removeClass('ui-selected');
					}
					$(this).find('.ui-resizable-handle').hide();
					$(this).toggleClass('ui-selected');
				});
			}
		}
	}
	$('#map').selectable({
		filter: '.object',
		unselected: function(event, ui){
			$(this).find('.ui-resizable-handle').show();
		},
		selected: function(event, ui){
			if(!tile_preview)
			{
				$(this).find('.ui-resizable-handle').hide();
			}
			else
			{
				$('.ui-selected').removeClass('ui-selected');
				return false;				
			}
		},
		selecting: function(event, ui){
			if(tile_preview)
			{
				$('.ui-selecting').removeClass('ui-selecting');
				return false;
			}
		}
	});
}

// Take all the tiles in the map and offload them as tiny canvas elements
function preloadTMXTilesets()
{
	// Load tiles into canvas blocks
	var canvases_container = $('#canvases');
	for(var i=0;i<tmx.tilesets.length;i++) 
	{
		var w = tmx.tilesets[i].tilewidth;
		var h = tmx.tilesets[i].tileheight;
		var gid = tmx.tilesets[i].firstgid || '';
		var totalx = tmx.tilesets[i].image.width/w;
		var totaly = tmx.tilesets[i].image.height/h;
		for(var y=0;y<totaly;y++)
		{
			for(var x=0;x<totalx;x++)
			{
				var id = gid+'_'+x+'_'+y;
				var tileid = canvases_arr.length+1;
				$('#tilesets').append('<canvas gid="'+gid+'" id="tileset'+id+'" tileid="'+tileid+'" width="'+w+'" height="'+h+'"></canvas>');
				new_tileset = document.getElementById('tileset'+id);
				canvases[id] = new_tileset.getContext("2d");
				canvases_arr.push(id);
				var img = new Image();
				img.src = tmx.tilesets[i].image.source;
				img.id = id;
				img.tw = w;
				img.th = h;
				img.tx = x;
				img.ty = y;
				total_tiles++;
				img.onload = function(){
					var ctx = canvases[this.id];
					ctx.drawImage(this,-(this.tw*this.tx),-(this.th*this.ty));
					total_tiles--;
					if(total_tiles == 0)
					{
						loadMap();
					}
				}
			}	
			$('#tilesets').append('<br/>');
		}
	}	
	var selector = $("#tileset-selectors");
	$('#tilesets canvas').each(function(){
		var $this = $(this);
		var p = $this.position();
		$('<div id="'+$this.attr('id')+'" tileid="'+$this.attr('tileid')+'"></div>').css({
			left:p.left+'px',
			top:p.top+'px',
			width:$this.attr('width')+'px',
			height:$this.attr('height')+'px',
		}).appendTo(selector);
	});
}

// Draw and load the toolbox
function loadToolbox()
{
	for(var i=tmx.layers.length-1;i>=0;i--)
	{
		var color = tmx.layers[i]['color'];
		if(color.length == 0)
		{
			color = '#eee';
		}
		var type = typeof(tmx.layers[i].tiles) == 'undefined' ? 'object' : 'tiles';
		$('#layers').append('<div class="layer-list'+(type=='tiles'?' ui-selected':'')+'" type="'+type+'" layer="'+i+'" style="border-left:2px solid '+color+'"><input class="layer-checkbox" type="checkbox" checked="true"> '+tmx.layers[i].name+'</div>');
	}
	$('.layer-checkbox').click(function(){
		var p = $(this).parents('div');
		if($(this).is(':checked'))
		{
			$('#layer'+p.attr('layer')).show();
		}
		else
		{
			$('#layer'+p.attr('layer')).hide();
		}
	});
	$('#layers').selectable({
		selected: selectedLayer,
		unselected: selectedLayer,
		stop: function(){alert("A")}
	});
}

/******************************************************************************
* General functions
*/
// Draw the current tile preview on the selected tile layer
function drawTiles()
{
	if(pending_changes == null)
	{
		pending_changes = new Map();
	}
	Stack.start();

	var previewObj = $('#preview');
	var x = parseInt(previewObj.css('left').replace('px',''))-1;
	var y = parseInt(previewObj.css('top').replace('px',''))-1;	
	var selected = parseInt($('.layer-list.ui-selected').attr('layer'));
	var canvas = document.getElementById('canvas'+selected)
	var ctx = canvas.getContext('2d');

	Stack.draw(Map.layers[selected], x, y);
	ctx.drawImage(preview, x-1, y-1);

	pending_changes.overrideWith(preview_map, x, y, true);
}



/******************************************************************************
* jQuery events
*/
// Move the tile preview with the mouse
var lastMouseMove = [0,0];
function mouseMove(event)
{
	var p = $('#preview');
	var x = event.pageX-(p.width()/2);
	var y = event.pageY-(p.height()/2);
	x = Math.round(x/tmx.map.tilewidth)*tmx.map.tilewidth-148;
	y = Math.round(y/tmx.map.tileheight)*tmx.map.tileheight+2;
	p.css({'left':x+'px', 'top':y+'px'});
	if(drawing && (x != lastMouseMove[0] || y != lastMouseMove[1]))
	{
		drawTiles();
		lastMouseMove = [x,y];
	}
}

// We are in tile preview mode so we should be drawing the tiles when we click and move
function mouseDown(event)
{
	event.preventDefault();
	drawing = true;
	drawTiles();
	$(document.body).bind('mouseup', mouseUp);	
}

// Mouseup so stop drawing
function mouseUp(event)
{
	var selected = parseInt($('.layer-list.ui-selected').attr('layer'));
	Map.layers[selected].overrideWith(pending_changes, 0, 0, false);

	drawing = false;
	pending_changes = null;
	Stack.stop();
	$(document.body).unbind('mouseup', mouseUp);
}

// A key was pressed
function keyPressed(event)
{
	if (event.metaKey)
	{
		switch(event.keyCode)
		{
			case 26:
				var selected = $('.layer-list.ui-selected');
				if(selected.is('[type=tiles]'))
				{			
					selected = parseInt($('.layer-list.ui-selected').attr('layer'));
					var canvas = document.getElementById('canvas'+selected);
					Stack.undo(canvas);
				}
				break;
		}
	}
}

/******************************************************************************
* JQueryUI functions
*/
// When a layer is selected
function selectedLayer(event, ui)
{
	var selected = $('.layer-list.ui-selected');
	if(!selected.is('[type=tiles]'))
	{
		$('#tilesets .ui-selected').removeClass('ui-selected');
		stopTilePreview();
	}
	else
	{
		tile_preview = true;
		$('.layer .ui-selected').removeClass('ui-selected');
	}
}

// Move the selected tile regions with the mouse
function startTilePreview(width, height, preview)
{
	stopTilePreview();
	tile_preview = true;
	$('#preview').show().css({'width':Math.round(width)+'px', 'height':Math.round(height)+'px', 'background-image':"url("+preview.toDataURL("image/png")+")"});
	$(document.body).bind('mousemove', mouseMove);
	$('#wrapper').bind('mousedown', mouseDown);
}

// Stop the tile preview
function stopTilePreview()
{
	tile_preview = false;
	$('#preview').hide();
	$(document.body).unbind('mousemove', mouseMove);
	$('#wrapper').unbind('mousedown', mouseDown);
}

// When the tile is selected
function selectedTile(event, ui)
{
	var selected = $('.layer-list.ui-selected');
	if(selected.is('[type=tiles]'))
	{
		var width = 0;
		var height = 0;
		var basex = 0;
		var basey = 0;
		preview_map = new Map();
		preview_ctx.clearRect(0,0,preview.width,preview.height)
		$('#tilesets .ui-selected').each(function(){
			var $this = $(this);
			var p = $this.position();
			// Set the left-top-most item to be the base for our x,y references
			if(basex == 0 && basey == 0)
			{
				basex = p.left;
				basey = p.top;
			}
			var x = p.left-basex;
			x -= Math.round(x/tmx.map.tilewidth);
			var y = p.top-basey
			y -= Math.round(y/tmx.map.tileheight);
			if(x+tmx.map.tilewidth > width) width = x+tmx.map.tilewidth;
			if(y+tmx.map.tileheight > height) height = y+tmx.map.tileheight;
			var id = $this.attr('id').replace('tileset','');
			preview_ctx.drawImage(canvases[id].canvas, x, y);
			preview_map.addTo($this.attr('tileid'), x/tmx.map.tilewidth, y/tmx.map.tileheight);
		});

		if(width > 0 && height > 0) 
		{
			startTilePreview(width, height, preview);
		}
		else
		{
			stopTilePreview();
		}
	}
	else
	{
		$('#tilesets .ui-selected').removeClass('ui-selected');
	}
}

/******************************************************************************
* Constructor and variables
*/
var map = null;
var canvases = [];
var canvases_arr = [];
var total_tiles = 0;
var preview = document.createElement('canvas');
var preview_ctx = preview.getContext('2d');
var preview_map = null;
var drawing = false;
var pending_changes = null;
$(function(){
	tmx.map.tilewidth = parseInt(tmx.map.tilewidth);
	tmx.map.tileheight = parseInt(tmx.map.tileheight);
	map = $('#map');
	map.css({'width':(tmx.map.width*tmx.map.tilewidth)+'px', 'height':(tmx.map.height*tmx.map.tileheight)+'px'});
	$('#wrapper').canvas('graph',{opacity:0.3,padding:[tmx.map.tilewidth,tmx.map.tileheight],boundColor:"#000",size:[2,2]});

	preloadTMXTilesets();
	loadToolbox();

	$('#tileset-selectors').selectable({
		selected: selectedTile,
		unselected: selectedTile,
	});
	$('#tilesets').click(function(){
		$('.ui-selected').removeClass('ui-selected');
		selectedTile();
	});

	$(document.body).keypress(keyPressed);
});