<?php
$tmx_data = array(
	'map' => array(),
	'tilesets' => array(),
    'layers' => array(),
);

libxml_use_internal_errors(false) ;
$xmldata = file_get_contents('Level1.tmx');
$xmldata = str_replace(array('<objectgroup ','</objectgroup>'),array('<layer ','</layer>'),$xmldata);
$tmx_file = simplexml_load_string($xmldata);

load_attributes($tmx_file, $tmx_data);
load_tilesets($tmx_file, $tmx_data);
load_objectgroups($tmx_file, $tmx_data);

function load_attributes($tmx_file, &$tmx_data)
{
    // Map attributes
    $tmx_attributes = $tmx_file->attributes();
    foreach($tmx_attributes as $k => $v)
    {
    	$tmx_data['map'][$k] = "$v";
    }
}

// Tilesets
function load_tilesets($tmx_file, &$tmx_data)
{
    $count = count($tmx_file->tileset);
    for($i=0;$i<$count;$i++)
    {
    	$tmx_item = $tmx_file->tileset[$i];
    	$tmx_attributes = $tmx_item->attributes();
    	$tmx_image_attributes = $tmx_item->image->attributes();

    	$tmx_data['tilesets'][] = array(
    		'firstgid' => "{$tmx_attributes['firstgid']}",
    		'name' => "{$tmx_attributes['name']}",
    		'tilewidth' => "{$tmx_attributes['tilewidth']}",
    		'tileheight' => "{$tmx_attributes['tileheight']}",
    		'image' => array(
    			'source' => "{$tmx_image_attributes['source']}",
    			'width' => "{$tmx_image_attributes['width']}",
    			'height' => "{$tmx_image_attributes['height']}",
    		)
    	);
    }
}

function load_objectgroups($tmx_file, &$tmx_data)
{
    // Objectgoups
    $count = count($tmx_file->layer);
    for($i=0;$i<$count;$i++)
    {
    	$tmx_item = $tmx_file->layer[$i];
    	$tmx_attributes = $tmx_item->attributes();

        $base_array = array(
            'name' => "{$tmx_attributes['name']}",
            'color' => isset($tmx_attributes['color']) ? "{$tmx_attributes['color']}" : "",
            'width' => "{$tmx_attributes['width']}",
            'height' => "{$tmx_attributes['height']}",        
        );
        if(!isset($tmx_item->data))
        {
            $tmx_data['layers'][$i] = $base_array + array(
                'properties' => array(),
                'object' => array(),
            );
            get_properties($tmx_data['layers'][$i]['properties'], $tmx_item);

            $o = -1;
            foreach($tmx_item->object as $object)
            {
                $tmx_data['layers'][$i]['object'][++$o] = array(
                    'properties' => array()
                );
                $tmx_attributes = $object->attributes();
                foreach($tmx_attributes as $k => $v)
                {
                    $tmx_data['layers'][$i]['object'][$o][$k] = "$v";
                }
                get_properties($tmx_data['layers'][$i]['object'][$o]['properties'], $object);
            }        
        }
        else
        {
            $tmx_data['layers'][$i] = $base_array + array(
                'tiles' => array()
            );

            // Actual tile information
            $tmx_tiles = gzdecode(base64_decode($tmx_item->data));
            $size = strlen($tmx_tiles);
            $split = 999;
            $row = -1;
            for($j=0;$j<$size;$j+=4)
            {
                if(++$split >= 60)
                {
                    $tmx_data['layers'][$i]['tiles'][++$row] = array();
                    $split = 0;
                }
                $tmx_data['layers'][$i]['tiles'][$row][] = ord($tmx_tiles[$j]);
            }        
        }
    }
}

function get_properties(&$container, $item)
{
	if(isset($item->properties))
	{
		$properties = $item->properties->property;
		if(!is_array($properties))
		{
			$properties = array($properties);
		}

		$i = -1;
		foreach($properties as $property)
		{
			$container[++$i] = array();
			$attributes = $property->attributes();
			foreach($attributes as $k => $v)
			{
				$container[$i][$k] = "$v";
			}
		}		
	}
}

function gzdecode($data,&$filename='',&$error='',$maxlength=null) 
{
    $len = strlen($data);
    if ($len < 18 || strcmp(substr($data,0,2),"\x1f\x8b")) {
        $error = "Not in GZIP format.";
        return null;  // Not GZIP format (See RFC 1952)
    }
    $method = ord(substr($data,2,1));  // Compression method
    $flags  = ord(substr($data,3,1));  // Flags
    if ($flags & 31 != $flags) {
        $error = "Reserved bits not allowed.";
        return null;
    }
    // NOTE: $mtime may be negative (PHP integer limitations)
    $mtime = unpack("V", substr($data,4,4));
    $mtime = $mtime[1];
    $xfl   = substr($data,8,1);
    $os    = substr($data,8,1);
    $headerlen = 10;
    $extralen  = 0;
    $extra     = "";
    if ($flags & 4) {
        // 2-byte length prefixed EXTRA data in header
        if ($len - $headerlen - 2 < 8) {
            return false;  // invalid
        }
        $extralen = unpack("v",substr($data,8,2));
        $extralen = $extralen[1];
        if ($len - $headerlen - 2 - $extralen < 8) {
            return false;  // invalid
        }
        $extra = substr($data,10,$extralen);
        $headerlen += 2 + $extralen;
    }
    $filenamelen = 0;
    $filename = "";
    if ($flags & 8) {
        // C-style string
        if ($len - $headerlen - 1 < 8) {
            return false; // invalid
        }
        $filenamelen = strpos(substr($data,$headerlen),chr(0));
        if ($filenamelen === false || $len - $headerlen - $filenamelen - 1 < 8) {
            return false; // invalid
        }
        $filename = substr($data,$headerlen,$filenamelen);
        $headerlen += $filenamelen + 1;
    }
    $commentlen = 0;
    $comment = "";
    if ($flags & 16) {
        // C-style string COMMENT data in header
        if ($len - $headerlen - 1 < 8) {
            return false;    // invalid
        }
        $commentlen = strpos(substr($data,$headerlen),chr(0));
        if ($commentlen === false || $len - $headerlen - $commentlen - 1 < 8) {
            return false;    // Invalid header format
        }
        $comment = substr($data,$headerlen,$commentlen);
        $headerlen += $commentlen + 1;
    }
    $headercrc = "";
    if ($flags & 2) {
        // 2-bytes (lowest order) of CRC32 on header present
        if ($len - $headerlen - 2 < 8) {
            return false;    // invalid
        }
        $calccrc = crc32(substr($data,0,$headerlen)) & 0xffff;
        $headercrc = unpack("v", substr($data,$headerlen,2));
        $headercrc = $headercrc[1];
        if ($headercrc != $calccrc) {
            $error = "Header checksum failed.";
            return false;    // Bad header CRC
        }
        $headerlen += 2;
    }
    // GZIP FOOTER
    $datacrc = unpack("V",substr($data,-8,4));
    $datacrc = sprintf('%u',$datacrc[1] & 0xFFFFFFFF);
    $isize = unpack("V",substr($data,-4));
    $isize = $isize[1];
    // decompression:
    $bodylen = $len-$headerlen-8;
    if ($bodylen < 1) {
        // IMPLEMENTATION BUG!
        return null;
    }
    $body = substr($data,$headerlen,$bodylen);
    $data = "";
    if ($bodylen > 0) {
        switch ($method) {
        case 8:
            // Currently the only supported compression method:
            $data = gzinflate($body,$maxlength);
            break;
        default:
            $error = "Unknown compression method.";
            return false;
        }
    }  // zero-byte body content is allowed
    // Verifiy CRC32
    $crc   = sprintf("%u",crc32($data));
    $crcOK = $crc == $datacrc;
    $lenOK = $isize == strlen($data);
    if (!$lenOK || !$crcOK) {
        $error = ( $lenOK ? '' : 'Length check FAILED. ') . ( $crcOK ? '' : 'Checksum FAILED.');
        return false;
    }
    return $data;
}