<?php
    $host = $_GET['host'];
    
    // Home directory for the heatmap script
    // -------------------
    $home_dir = '/home/quanticpost3/public_html/heatmap_info/';
    $page_array = array();
    
    $all_heatmap_info = array();
    
    // Recursive Dir
    // -------------------
    function recursive_dir($directory){
        $dir = scandir($directory);
        $directories = array();
        foreach($dir as $f){
            if($f != '.' && $f != '..'){
                if(is_dir($directory.'/'.$f)){
                    $directories[$directory.'/'.$f] = recursive_dir($directory.'/'.$f);
                } else {
                    $directories[$directory.'/'.$f] = $directory.'/'.$f;
                }
            }
        }
        return $directories;
    }
    
    // Display Info
    // -------------------
    function display_info($file){
  		$heatmap_info_holder = array();
    	
        $fh = fopen($file,'r');
        $count = 0;
		while(($line = fgets($fh))){
			$json = json_decode($line,true);
			$ipaddress = $json['ipaddress'];
			$heatmap_info = str_replace("'",'"',str_replace('"','',$json['heatmap_info']));
			$heatmap_info = str_replace('}{','},{',str_replace("},","}",$heatmap_info));
			$json = json_decode($heatmap_info,true);
			if(sizeof($json) > 0){
			    foreach($json as $j){
			        $heatmap_info_holder[] = $j;
			    }
			}
		}
		return $heatmap_info_holder;
    }
    
    $files = recursive_dir($home_dir.$host);
    
    // Recursive Setup
    // -------------------
    function recursive_setup($file,&$all_heatmap_info,$key){
		if(is_array($file)){
			if(is_array($file[key($file)])){
				recursive_setup($file[key($file)],$all_heatmap_info,key($file));
				while(next($file)){
					recursive_setup($file[key($file)],$all_heatmap_info,key($file));
				}
			} else {
				$all_heatmap_info[$file[key($file)]] = display_info($file[key($file)]);
				while(next($file)){
					recursive_setup($file[key($file)],$all_heatmap_info,key($file));
				}
			}
		} else {
			$all_heatmap_info[$key] = display_info($file);
			while(next($file)){
				recursive_setup($file[$key],$heatmap_info,$key);
			}
		}
    }
    
    // Adding information to the recursive setup
    // -------------------
    recursive_setup($files,$all_heatmap_info);
    $info = array();
    
    foreach($all_heatmap_info as $k=>$f){
        $other[$k] = sizeof($f);
    }
    arsort($other);
    
    foreach($other as $k=>$f){
        $info[$k] = $all_heatmap_info[$k];
    }
    unset($all_heatmap_info);
    unset($other);
    
    $info = json_encode($info);
?>
<html>
	<head>
		<title></title>
		<style>
		    body{
		        font-family: verdana;
		        margin: 0px;
		        overflow: hidden;
		    }
		    #iframe_info{
		        width: 100%;
		        height: 600px;
		        border: none;
		    }
		    .heatmap_holder{
		    	list-style: none;
		    	padding: 0px;
		    	margin: 0px;
		    	margin-bottom: 10px;
		    }
		    #heatmap_canvas_holder{
		    	height: 600px;
		    	overflow: hidden;
		    }
		    .canvas_holder{
		        height: 600px;
		        width: 100%;
		    }
		    a{
		        color: #ababab;
		        text-decoration: none;
		        padding: 10px;
		    }
		    li{
		        padding: 5px;
		        font-size: 11px;
		        text-transform: uppercase;
		        margin-top: 2px;
		    }
		    #overlay{
		        position: absolute;
		        top: 0px;
		        right: 120px;
		        background: rgba(255,255,255,1);
		        padding: 10px;
		        z-index: 100000;
		    }
		    .heatmap_holder{
		    	position: absolute;
		    	background: #fff;
		    	width: 100%;
		    	margin-top: 0px;
		    	z-index: 1000;
		    	top: 0px;
		    	padding: 10px;
		    }
		    .selection{
		    	background: #fff;
			    color: #000;
			    padding: 10px;
			    height: 20px;
			    display: block;
			    position: fixed;
			    top: 0px;
			    z-index: 10000;
			    width: 100%;
		    }
		    #iframe_info{
		        height: 100%;
		    }
		    .testing{
		    	margin-top: 40px;
		    }
		    .clear{
		    	clear: both;
		    }
		    h3{
		        font-size: 14px;
		        margin: 0px;
		        padding: 0px;
		        margin-bottom: 10px;
		    }
		    .tw_input, .tw_select{
		        background: #ababab;
		        color: #fff;
		        padding: 10px;
		        font-size: 11px;
		    }
		    .heatmap_holder{
		        display: none;
		        position: relative;
		        top: 11px;
		    }
		    .selection{
		        background: #000;
		        color: #fff;
		        position: absolute;
		        top: 0px;
		        padding: 10px;
		    }
		    .heatmap_holder li{
		    	display: block;
		    }
		    .granularity_holder{
		        padding: 10px;
		        position: absolute;
		        top: 0px;
		        right: 10px;
		        background: rgba(255,255,255,1);
		        color: #ababab;
		        padding: 10px;
		    }
		    .granularity_holder a{
		        color: #545454;
		    }
		</style>
	</head>
	<body>
	    <div class="selection">
	    	<?php if($info != ''){ ?>Select Pages<?php } else { ?>No Clicks Available<?php } ?>
	    	<ul class="heatmap_holder"></ul>
			<div class="granularity_holder"><a href="" id="granularity_button">Granularity</a></div>
	    </div>
		<div class="testing">
		    <iframe src="" id="iframe_info"></iframe>
		    <div style="height: 600px; width: 100%; overflow: hidden;" class="overlay">
		    	<div id="heatmap_canvas_holder"></div>
		    </div>
		</div>
		<script>
		    var server_root = '<?php echo $_SERVER['DOCUMENT_ROOT']; ?>';
		    var host = '<?php echo $host; ?>';
		    var info = '<?php echo $info; ?>';
		    var directory_structure = '<?php echo json_encode($files); ?>';
		</script>
		<script src="../../../js/tw_heatmap.js"></script>
		<script src="../../../js/tw_heatmap_info.js"></script>
	</body>
</html>