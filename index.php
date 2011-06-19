<?php
include_once 'tmx_functions.php';
?>
<html><head>
<link type="text/css" rel="stylesheet" href="jqueryui.css"/>
<link type="text/css" rel="stylesheet" href="style.css"/>
<script type="text/javascript" src="js/jquery-1.6.1.min.js"></script>
<script type="text/javascript" src="js/jQuery.canvas.js"></script>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.13/jquery-ui.min.js"></script>
<script type="text/javascript">
var tmx = (<?php echo json_encode($tmx_data); ?>);
</script>
<script type="text/javascript" src="js/tmxify.js"></script>
<script type="text/javascript" src="js/classes.js"></script>
</head><body>
<div id="toolbox">
	<div id="toolbox-wrapper">
		<!--<div class="toolbox-header">TMXify</div>-->
		<div class="toolbox-subheader">Layers</div>
		<div id="layers"></div>
		<div class="toolbox-subheader">Tilesets</div>
		<div id="tilesets"><div id="tileset-selectors"></div></div>
	</div>
</div>
<div id="wrapper">
	<div id="map"><div id="preview"></div></div>
</div>
</body></html>