var tw_heatmap = function(type,canvas,heatmap_overlay_info,iframe){
    this.type = (type == undefined)?'click':type;
    this.timer = 0;
    this.window_info = [];
    this.mouse_move = [];
    this.close_legend = 'false';
    self = this;
    
	this.rgb = function(minimum, maximum, value){
	    var ratio = 2 * (value-minimum) / (maximum - minimum);
	    b = parseInt(Math.ceil(0, 255*(1 - ratio)));
	    r = parseInt(Math.ceil(0, 255*(ratio - 1)));
	    g = 255 - b - r;
	    return {'r':r,'g':g,'b':b};
	}
    
    this.gradient_colors = function(min,max,value,radius){
    	var highest_color = 255;
    	
    	var rgb = [255,255,255];
    	var full_spectrum = highest_color * 3;
    	
    	var percentage = ((value/max)*100);
    	var x = parseInt((percentage/100)*full_spectrum);
    	
    	if(x < 381){
        	rgb[0] = (x-382 > 0)?x-382:x;
        	x -= 382;
        	rgb[1] = (x-382 > 0)?x-382:0;
    	} else if(x < 382){
    		rgb[0] = (x-382 > 0)?x-382:x;
    		x -= 382;
    		rgb[1] = (x-382 > 0)?x-382:0;
    	} else {
    		rgb[1] = (x-382 > 0)?x-382:x;
    		rgb[2] = (x-382 > 0)?x-382:0;
    	}
    	
    	rgb[1] = (isNaN(rgb[1]))?255:rgb[1];
    	return rgb;
    }
    
    this.check_closed = function(){
    	return this.close_legend;
    }
    
    setInterval(function(){ self.timer += 100; },100);
    
    this.info = function(mouse_move,ctx,canvas,iframe,close_legend,coordinates,granularity){
        this.granularity = (granularity != undefined)?granularity:30;
		ctx.save();
		
		var heatmap = [];
		var totals = 0;
		var radius_info = this.granularity;
		
		var radius = this.granularity;
		
		if(radius != 'clicks_only'){
    		for(var i = 0; i < mouse_move.length; i++){
    			for(var j = 0; j < mouse_move.length; j++){
    				if(mouse_move[i].x <= mouse_move[j].x+radius_info && mouse_move[i].x >= mouse_move[j].x-radius_info
    				    && mouse_move[i].y <= mouse_move[j].y+radius_info && mouse_move[i].y >= mouse_move[j].y-radius_info){
    						total = (heatmap[i] != undefined)?heatmap[i].total+1:1;
    						heatmap[i] = {"x":mouse_move[i].x,"y":mouse_move[i].y,"total":total,"time":mouse_move[i].time};
    						if(total > totals) totals = total;
    				}
    			}
    		}
		} else {
		    radius = 10;
		    for(var i = 0; i < mouse_move.length; i++){
    			for(var j = 0; j < mouse_move.length; j++){
					total = 1;
					heatmap[i] = {"x":mouse_move[i].x,"y":mouse_move[i].y,"total":total,"time":mouse_move[i].time};
    			}
    		}
    		totals = 1;
		}
		
		ctx.beginPath();
		ctx.rect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = 'rgba(0,0,0,.4)';
		ctx.fill();
		
		var currentSelection = [];
		
		for(var i = 0; i < heatmap.length; ++i){
		    gradient = ctx.createRadialGradient(heatmap[i].x,heatmap[i].y,0,heatmap[i].x,heatmap[i].y,radius);
			
			var rgb = this.gradient_colors(0,totals,heatmap[i].total,radius);
			
			var calculated_radius = parseInt(radius*(heatmap[i].total/totals));
			
		    if(coordinates != undefined){
		        var mouse_x = coordinates[0]+calculated_radius;
		        var mouse_y = coordinates[1]+calculated_radius;
		        if(mouse_x >= heatmap[i].x && mouse_x <= parseInt(parseInt(heatmap[i].x)+((calculated_radius*2)))
		        && mouse_y >= heatmap[i].y && mouse_y <= parseInt(parseInt(heatmap[i].y)+((calculated_radius*2)))
		        ){
		            currentSelection[heatmap[i].total] = heatmap[i]; 
		        } else{
					gradient.addColorStop(0,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",.4)");
					gradient.addColorStop(1,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",.2)"); 
		        }
		        ctx.beginPath();
				
    			ctx.arc(heatmap[i].x,heatmap[i].y,radius*(heatmap[i].total/totals),2*Math.PI,false);
    			ctx.fillStyle = gradient;
    			ctx.fill();
		    } else {
		        gradient.addColorStop(0,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",.4)");
			    gradient.addColorStop(1,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",.2)");
			    
			    ctx.beginPath();
		
    			ctx.arc(heatmap[i].x,heatmap[i].y,radius*(heatmap[i].total/totals),2*Math.PI,false);
    			ctx.fillStyle = gradient;
    			ctx.fill();
		    }
		}
		
		currentSelection.sort();
		if(currentSelection[1] != undefined){
    		for(var i = 1; i < currentSelection.length; ++i){
    		    if(currentSelection[i] != undefined){
        		    var rgb = this.gradient_colors(0,totals,currentSelection[i].total,radius);
        		    gradient = ctx.createRadialGradient(currentSelection[i].x,currentSelection[i].y,0,currentSelection[i].x,currentSelection[i].y,radius);
        		    gradient.addColorStop(0,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
        			gradient.addColorStop(1,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",0)"); 
        		    ctx.beginPath();
        			
            		ctx.arc(currentSelection[i].x,currentSelection[i].y,radius*(currentSelection[i].total/totals),2*Math.PI,false);
            		ctx.fillStyle = gradient;
            		ctx.fill();
    		    }
    		}
		}
		
		if(currentSelection[0] != undefined){
		    var rgb = this.gradient_colors(0,totals,currentSelection[0].total,radius);
    		
    		currentSelection[0].x = parseInt(currentSelection[0].x);
    		currentSelection[0].y = parseInt(currentSelection[0].y);
    		
    		var info_radius_pos = parseInt(parseInt(currentSelection[0].x)+parseInt(radius*(currentSelection[0].total/totals))+10)
    		gradient = ctx.createLinearGradient(info_radius_pos-20,currentSelection[0].y-20,info_radius_pos+100,currentSelection[0].y-20);
    		gradient.addColorStop(0,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
    		gradient.addColorStop(".3","rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
    		gradient.addColorStop(".4","rgba(255,255,255,1)");
			gradient.addColorStop(1,"rgba(255,255,255,1)");
    		
    		ctx.beginPath();
    		ctx.arc(currentSelection[0].x,currentSelection[0].y,(radius*(currentSelection[0].total/totals))*2,2*Math.PI,false);
    		ctx.fillStyle = 'transparent';
    		ctx.lineWidth = '5';
    		ctx.strokeStyle = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)";
    		ctx.stroke();
    		ctx.fill();
    		
    		ctx.beginPath();
			ctx.rect(info_radius_pos-20,currentSelection[0].y-9,100,17);
			ctx.fillStyle = gradient;
			ctx.fill();
			
			gradient = ctx.createRadialGradient(currentSelection[0].x,currentSelection[0].y,0,currentSelection[0].x,currentSelection[0].y,radius);
    		gradient.addColorStop(0,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
			gradient.addColorStop(1,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
    		
    		var radius_size = (radius*(currentSelection[0].total/totals))/2;
    		radius_size = (radius_size < 12)?12:radius_size;
    		radius_size = (radius_size > 15)?15:radius_size;
    		
    		gradient = ctx.createRadialGradient(currentSelection[0].x,currentSelection[0].y,0,currentSelection[0].x,currentSelection[0].y,radius);
    		gradient.addColorStop(0,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
			gradient.addColorStop(1,"rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)");
    		
    		ctx.save();
    		
    		ctx.shadowColor = 'rgba(0,0,0,1)';
    		ctx.shadowOffsetX = '0';
    		ctx.shadowOffsetY = '1';
    		ctx.shadowBlur = '2';
    		
    		ctx.fillStyle = 'rgba(255,255,255,1)';
			ctx.font = radius_size+"px Arial";
            ctx.fillText(currentSelection[0].total+" Clicks",info_radius_pos,parseInt(currentSelection[0].y)+4);
    		
    		ctx.restore();
    		
    		ctx.beginPath();
    		ctx.arc(currentSelection[0].x,currentSelection[0].y,(radius*(currentSelection[0].total/totals)),2*Math.PI,false);
    		ctx.fillStyle = gradient;
    		ctx.fill();
		}
		
		this.iframe = window.scrollY;
		this.ctx = ctx;
		this.canvas = canvas;
		
		if(self.iframe != undefined && close_legend == 'false'){
		    var scrollY = window.scrollY;
		    //ctx.globalCompositeOperation = 'lighter';
		    console.log(ctx.globalCompositeOperation);
    		gradient_linear = ctx.createLinearGradient(0,scrollY,0,300+scrollY);
    		gradient_linear.addColorStop(".1","rgba(255,255,255,1)");
    		gradient_linear.addColorStop(".3","rgba(255,0,0,1)");
    		gradient_linear.addColorStop(".7","rgba(0,255,0,1)");
    		gradient_linear.addColorStop(1,"rgba(0,0,255,1)");
    		
    		ctx.beginPath();
    		ctx.rect(10,window.scrollY+10,30,300);
    		ctx.fillStyle = gradient_linear;
    		ctx.fill();
    		
    		ctx.beginPath();
    		ctx.rect(30,window.scrollY+10,100,300);
    		ctx.fillStyle = 'rgba(0,0,0,.6)';
    		ctx.fill();
    		
    		ctx.fillStyle = "white";
			ctx.font = "10px Arial";
            ctx.fillText("Heavy Clicks",50,scrollY+20);
    		
    		var distance = 10;
    		
    		ctx.beginPath();
			ctx.rect(10,window.scrollY+(15),35,1);
			ctx.fillStyle = 'rgba(255,255,255,.2)';
			ctx.fill();
    		
			for(var i = 0; i < 12; i++){
				ctx.beginPath();
				ctx.rect(10,window.scrollY+((distance*i)+25),110,1);
				ctx.fillStyle = 'rgba(255,255,255,.2)';
				ctx.fill();
			}
            
            ctx.fillStyle = "white";
			ctx.font = "10px Arial";
            ctx.fillText("Medium Clicks",50,scrollY+152);
            
            ctx.beginPath();
			ctx.rect(10,window.scrollY+(147),35,1);
			ctx.fillStyle = 'rgba(255,255,255,.2)';
			ctx.fill();
            
            for(var i = 0; i < 12; i++){
				ctx.beginPath();
				ctx.rect(10,window.scrollY+((distance*i)+160),110,1);
				ctx.fillStyle = 'rgba(255,255,255,.2)';
				ctx.fill();
			}
            
            ctx.fillStyle = "white";
			ctx.font = "10px Arial";
            ctx.fillText("Low Clicks",50,scrollY+290);
			
			canvas.onclick = function(el){
				if(self.close_legend != 'true'){
					self.close_legend = 'true';
					self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
					self.info(self.mouse_move,self.ctx,self.canvas,self.iframe,self.close_legend);
				} else {
					self.close_legend = 'false';
					self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
					self.info(self.mouse_move,self.ctx,self.canvas,self.iframe,self.close_legend);
				}
			}
		}
		
        ctx.restore();
    }
    
    this.process_info = function(type,x,y,ctx,screen){
    	var ctx = this.canvas.getContext('2d');
    	if(self.type == 'click'){
    		this.mouse_move.push({'x':x,'y':y,'screen_width':screen.width,'time':this.timer});
    		this.info(this.mouse_move,ctx,this.canvas);
    	}
    }
    
    this.loadXMLDoc = function(heatmap_info,window_info){
        var xmlhttp;
        if (window.XMLHttpRequest){
            xmlhttp=new XMLHttpRequest();
        }else{
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        
        xmlhttp.onreadystatechange=function(){
			if (xmlhttp.readyState==4 && xmlhttp.status==200){
				xmlhttp.responseText;
			}
		}
        
        xml = '"[';
        var curr_time = 0;
        for(var i = 0; i < heatmap_info.length; ++i){
            if(heatmap_info[i].time != curr_time){
                xml += "{'x':'"+heatmap_info[i].x+"','y':'"+heatmap_info[i].y+"','screen_width':'"+heatmap_info[i].screen_width+"','time':'"+heatmap_info[i].time+"'},";
            }
            curr_time = heatmap_info[i].time;
        }
        xml += ']"';
        
        curr_time = 0;
        xml_info = '"[';
        for(var i = 0; i < self.window_info.length; ++i){
            if(self.window_info[i].time != curr_time){
                xml_info += "{'x':'"+self.window_info[i].x+"','y':'"+self.window_info[i].y+"','height':'"+self.window_info[i].height+"','width':'"+self.window_info[i].width+"','time':'"+self.window_info[i].time+"'},";
            }
            curr_time = self.window_info[i].time;
        }
        xml_info += ']"';
        
        xmlhttp.open("POST","http://quanticpost.com/get_clicks",true);
        xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xmlhttp.send('heatmap_info='+xml+'&window_info='+xml_info+'&type='+self.type);
    }
    
    this.init = function(){
        this.canvas = document.createElement('canvas');
        this.active_heatmap = false;
        this.canvas.setAttribute('id','heatmap');
        this.body = document.getElementsByTagName('body')[0];
        
        this.canvas.width = this.body.offsetWidth;
        this.canvas.height = this.body.offsetHeight;
        
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0px';
        this.canvas.style.left = '0px';
        this.body.appendChild(this.canvas);
        
        this.mouse_move = [];
        this.click = [];
        
        this.c = document.getElementById('heatmap');
        this.c.style.opacity = '.6';
        
        this.timer = 0;
        this.canvas.style.zIndex = 100;
        this.canvas.style.display = 'none';
        
        this.interval = setInterval(function(){
            self.timer += 1;
        },100);
        
        if(self.type == 'move'){
            this.body.addEventListener('mousemove', function(el){
            	var screen = {'width':el.currentTarget.offsetWidth,'height':el.currentTarget.offsetHeight};
    			self.process_info('move',el.pageX,el.pageY,self.canvas,screen);
            },false);
        } else {
            this.body.addEventListener('click',function(el){
            	var screen = {'width':el.currentTarget.offsetWidth,'height':el.currentTarget.offsetHeight};
            	self.process_info('click',el.pageX,el.pageY,self.canvas,screen);
            },false);
        }
    }
    
    if(this.type != 'show_heatmap'){
        self.init();
        
        window.onbeforeunload = function(){
            if(this.type == 'click'){
                self.loadXMLDoc(self.mouse_move,self.window_info);
            } else {
                self.loadXMLDoc(self.mouse_move,self.window_info);
            }
        }
        
        window.onscroll = function(){
            var sidebar = document.getElementsByClassName('side_slider')[0];
            if(window.parent.postMessage != undefined){
            	window.parent.postMessage('{"info":"scroll_info","x":'+window.scrollX+',"y":'+window.scrollY+'}','http://quanticpost.com');
            }
            
            var articles = document.getElementsByTagName('article')[0];
            
            if(articles != undefined){
                articles = articles.getElementsByTagName('div');
                self.window_info.push({'x':window.scrollY,'y':window.scrollX,'height':window.innerHeight,'width':window.innerWidth,'time':self.timer});
            } else {
                self.window_info.push({'x':window.scrollY,'y':window.scrollX,'height':window.innerHeight,'width':window.innerWidth,'time':self.timer});
            }
        }
    }
}

get_frame_width = function(e){
	if(e.origin == 'http://quanticpost.com'){
	    if(e.data == 'get_width_height'){
	    	e.source.postMessage('{"info":"get_width_height","height":'+document.body.scrollHeight+',"width":'+document.body.scrollWidth+',"scrollY":'+window.scrollY+'}','http://quanticpost.com');
	        return;
	    } 
	    if(e.data == 'get_scroll'){
	    	e.source.postMessage('{"info":"scroll_info","scrollY":'+window.scrollY+',"scrollX":'+window.scrollX+'}','http://quanticpost.com');
	    }
	    if(e.data == 'get_y_scroll'){
	        e.source.postMessage('{"info":"get_y_scroll","scrollY":'+window.scrollY+'}');
	    }
	}
}
window.addEventListener('message',get_frame_width,true);