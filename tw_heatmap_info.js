var selection = document.getElementsByClassName('selection')[0];
var selection_timeout = setTimeout(function(){ },0);

selection.onmouseover = function(){
    document.getElementsByClassName('heatmap_holder')[0].style.display = 'block';
    setTimeout(function(){ 
    },1000);
}

info = JSON.parse(info);

var information = [];
var click_info = [];
var links = [];

for(a in info){
    var link = a.replace(server_root+'/heatmap_info/','');
    
	document.getElementsByClassName('heatmap_holder')[0].innerHTML += '<li><a href="http://'+link+'">'+link+'</a></li>';
    click_info[a] = [];
    click_info[a]['total'] = 0;
    
    for(b in info[a]){
        click_info[a]['total'] += 1;
        click_info[a].push({"x":info[a][b].x,"y":info[a][b].y,"time":info[a][b].time});
    }
}
document.getElementsByClassName('heatmap_holder')[0].innerHTML += '<div class="clear"></div>';

var close_legend = 'false';
var canvas_info = [];

var input_form = '<div class="tw_input">[tw_title] <input type="[tw_type]" name="[tw_name]" value="[tw_value]"/>';
var select_form = '<div class="tw_select">[tw_title] <select name="[tw_name]">[tw_options]</select>';

function validate(value){
	if(value == ''){
		return [{'error':'cannot be empty'}];
	}
}

function set_inputs(title,name,type,form,parent,options_array){
	switch(type){
		case 'text':
		case 'radio':
		case 'submit':
			var input_text = input_form;
			input_text = input_text.replace('[tw_name]',name);
			input_text = input_text.replace('[tw_title]',title);
			input_text = input_text.replace('[tw_type]',type);
			if(type == 'submit'){
				input_text = input_text.replace('[tw_value]',name);
			} else {
				var value = form.getElementsByName(name)[0].getAttribute('value');
				var validate_info = validate(value);
				input_text = input_text.replace('[tw_value]',value);
			}
			form.innerHTML = input_text;
			break;
		case 'select':
			var select_text = select_form;
			select_text = select_text.replace('[tw_name]',name);
			select_text = select_text.replace('[tw_title]',title);
			var options = '<option value="[tw_value]">[tw_option_title]</option>';
			var option_string = '';
			for(var i = 0; i < options_array.length; ++i){
				var option_holder = options;
				option_holder = option_holder.replace('[tw_value]',options_array[i].replace(' ','_'));
				option_holder = option_holder.replace('[tw_option_title]',options_array[i]);
				option_string += option_holder;
			}
			select_text = select_text.replace('[tw_options]',option_string);
			form.innerHTML = select_text;
			break;
		default:
			form.innerHTML = input_form;
			form.innerHTML = form.innerHTML.replace('[tw_name]',name);
			form.innerHTML = form.innerHTML.replace('[tw_title]',title);
			form.innerHTML = form.innerHTML.replace('[tw_type]',type);
			break;
	}
	parent.appendChild(form);
}

function change_granularity(heatmap_overlay_info,ctx_overlay,canvas,iframe,close_legend,coordinates){
	if(document.getElementById('overlay') !== null){
		document.getElementById('overlay').remove();
	}
	
	var info = document.createElement('div');
	var submit = document.createElement('div');
	var options = document.createElement('div');
	var title = document.createElement('h3');
	title.textContent = 'Granularity';
	
	var overlay = document.createElement('div');
	overlay.setAttribute('id','overlay');
	
	var options_array = ['select granularity','clicks only','10','20','30','40','50','60','70','80','90','100'];
	
	overlay.appendChild(title);
	set_inputs('Click Size','size','select',options,overlay,options_array);
	
	document.body.appendChild(overlay);
	
	document.getElementsByName('size')[0].onchange = function(){
		granularity = document.getElementsByName('size')[0].value;
		var canvas_info = {'x':canvas.style.top,'y':canvas.style.left};
		new_layout('{"info":"get_width_height","height":'+canvas.height+', "width":'+canvas.width+', "scrollY":0}',current_page,granularity,canvas_info);
	}
}

var count = 0;
for(a in click_info){
    var link = a.replace(server_root+'/heatmap_info/','');
    var info = document.getElementsByClassName('heatmap_holder')[0].getElementsByTagName('li')[count].innerHTML;
    document.getElementsByClassName('heatmap_holder')[0].getElementsByTagName('li')[count].innerHTML = info.replace('>'+link+'<','>'+link+' <span style="background: #000; padding: 5px;">'+parseInt(click_info[a].total)+' clicks</span><');
    ++count;
}
var iframe = document.getElementById('iframe_info');

var heatmap_buttons = document.getElementsByClassName('heatmap_holder')[0].getElementsByTagName('li');
document.getElementsByTagName('body')[0].onclick = function(){
	document.getElementsByClassName('heatmap_holder')[0].style.display = 'none';
}

var intervalSet = null;

function new_layout(data,current_page,granularity_info){
	iframe.style.opacity = '1';
    var json = JSON.parse(data);
    var granularity = (granularity_info != null)?granularity_info:granularity;
    if(json.info == 'get_width_height'){
        var canvas = document.createElement('canvas');
        canvas.setAttribute('id','heatmap');
        canvas_holder = document.getElementById('heatmap_canvas_holder');
        canvas_holder.innerHTML = '';
        
        canvas.width = json.width;
        canvas.height = json.height;
        
        canvas.style.position = 'absolute';
        canvas.style.top = iframe.offsetTop;
        canvas.style.left = iframe.offsetLeft;
        if(canvas_info.y != iframe.offsetTop){
            canvas.style.top = -canvas_info.y+iframe.offsetTop;
        }
        if(canvas_info.x != iframe.offsetLeft){
            canvas.style.left = -canvas_info.x+iframe.offsetLeft;
        }
        canvas_holder.appendChild(canvas);
        
        canvas = document.getElementById('heatmap');
        
        var heatmap_overlay_info = click_info[current_page];
        var heatmap_info = new tw_heatmap('show_heatmap',canvas,heatmap_overlay_info,iframe);
        var ctx_overlay = canvas.getContext('2d');
        heatmap_info.info(heatmap_overlay_info,ctx_overlay,canvas,iframe,heatmap_info.close_legend,null,granularity);
        
        canvas.onmousemove = function(el){
            var ctx_overlay = canvas.getContext('2d');
            ctx_overlay.clearRect(0,0,canvas.width,canvas.height);
            var rect = canvas.getBoundingClientRect();
            var coordinates = [parseInt(el.pageX-rect.left),parseInt(el.pageY-rect.top)];
            heatmap_info.info(heatmap_overlay_info,ctx_overlay,canvas,iframe,heatmap_info.close_legend,coordinates,granularity);
        }
        
        document.getElementById('granularity_button').onclick = function(){
			change_granularity(heatmap_overlay_info,ctx_overlay,canvas,iframe,heatmap_info.close_legend);
			return false;
		}
    } 
    if(json.info == 'scroll_info') {
        canvas = document.getElementById('heatmap');
        canvas_info = {'x':json.x,'y':json.y};
        canvas.style.top = -json.y+iframe.offsetTop;
        canvas.style.left = -json.x+iframe.offsetLeft;
    }
}

for(var i = 0; i < heatmap_buttons.length; ++i){
    heatmap_buttons[i].onclick = function(el){
    var url_link = el.currentTarget.getElementsByTagName('a')[0].getAttribute('href');
    if(url_link.search('home') < 0){
        document.getElementById('iframe_info').setAttribute('src',el.currentTarget.getElementsByTagName('a')[0].getAttribute('href'));
    } else {
        document.getElementById('iframe_info').setAttribute('src',el.currentTarget.getElementsByTagName('a')[0].getAttribute('href').replace('home',''));
    }
    var span_info = el.currentTarget.getElementsByTagName('span')[0].innerHTML;
    current_page = el.currentTarget.getElementsByTagName('a')[0].innerHTML.replace(span_info,'').replace(' <span style="background: #000; padding: 5px;">','').replace('</span>','');
    
    if(document.getElementById('heatmap') != null){
        document.getElementById('heatmap').remove();
    }
    
    current_page = server_root+'/heatmap_info/'+current_page;
  	iframe.style.opacity = '0';
  	
  	window.onresize = function(el){
  		var info = iframe.offsetWidth;
    }
  	
    iframe.onload = function(){
        window.addEventListener('message', function(e){
        	new_layout(e.data,current_page);
        }, false);
        
        var content = iframe.contentWindow.postMessage('get_width_height','http://'+host);
    }
    
    return false;
    }
}