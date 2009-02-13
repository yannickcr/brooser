/*
Script: Brooser.js
	Brooser - A server-side file browser for Mootools.

Copyright:
	Copyright (c) 2007 Yannick Croissant

License:
	MIT-style license (see MIT-LICENSE.txt)

Version:
	0.9

 */

/*
Class: Brooser
	Make a server-side file browser.

Dependencies :
	Require the following files from Mootools 1.1.x
		<Core.js>
		<Class.js>, <Class.Extras.js>
		<Array.js>, <String.js>, <Function.js>, <Element.js>
		<Element.Event.js>, <Element.Selectors.js>
		<Window.DomReady.js>, <Window.Size.js>
		<XHR>, <Json>

Options:
	targetData - data to return; default is 'path'.
		possibles values :
			path - for the complete path
			file - for the filename
	currentDir - directory to start in (relative to the javascript file directory); current dir by default.
	phpFile: - path to the server-side script; "php/Brooser.php" by default.

Events:
	onFinish - the function to execute when the "Open" button is pressed; nothing (<Class.empty>) by default.

Example:
	>new Brooser('browse',{
	> currentDir:'./../test',
	> onFinish:function(file) {
	>  $('file').value=file;
	> }
	>});
*/
var Brooser = new Class({

	options: {
		onFinish:   Class.empty,
		targetData: 'path',
		currentDir: './',
		phpFile:    'php/Brooser.php'
	},

	initialize: function(element,options){
		this.element = this.element || element;
		this.XHRRequest = null;
		this.setOptions(options);
		this.contruct();
		this.setTarget();
	},
	
	/*
	Property: contruct
		Make :
		> <div id="brooser">
		>  <ul id="brooser-browser" />
		>  <input type="button" id="brooser-open" value="Open" />
		>  <div id="brooser-infos">
		>   <div id="brooser-head">
		>    <img id="brooser-icon" />
		>    <h1 />
		>    <span id="brooser-date">Modified : </span>
		>   </div>
		>   <h2>Informations</h2>
		>   <dl>
		>    <dt>Type :</dt>
		>    <dd id="brooser-type" />
		>    <dt>Size :</dt>
		>    <dd id="brooser-size" />
		>    <dt>Directory :</dt>
		>    <dd id="brooser-dir" title="" />
		>   </dl>
		>   <h2>Preview</h2>
		>   <div id="brooser-preview" />
		>  </div>
		>  <a id="brooser-close" href="#">Close</a>
	    > </div>
	*/
	contruct: function(){
		if($('brooser')) return false;	// Browser already exist, skiping
		new Element('div',{
				id:'brooser-overlay',
				styles:{
					display:'none',
					position:'absolute',
					left:0,
					top:0
				}
			})
			.injectInside(document.body);
		var brooser = new Element('div',{
				id:'brooser',
				styles:{
					display:'none'
				}
			})
			.injectInside(document.body);
		new Element('ul',{
				id:'brooser-browser'
			})
			.injectInside(brooser);
		new Element('input',{
				id:'brooser-open',
				type:'button',
				value:'Open'
			})
			.injectInside(brooser);
		var infos = new Element('div',{
				id:'brooser-infos'
			})
			.injectInside(brooser);
		var head = new Element('div',{
				id:'brooser-head'
			})
			.injectInside(infos);
			
		new Element('img',{id:'brooser-icon'}).injectInside(head);
		new Element('h1').injectInside(head);
		new Element('span',{id:'brooser-date'}).appendText('Modified : ').injectInside(head);
		new Element('h2').appendText('Informations').injectInside(infos);
		
		var list = new Element('dl').injectInside(infos);
		var dt = new Element('dt');
		var dd = new Element('dd');
		dt.clone().appendText('Type :').injectInside(list);
		dd.clone().setProperty('id','brooser-type').injectInside(list);
		dt.clone().appendText('Size :').injectInside(list);
		dd.clone().setProperty('id','brooser-size').injectInside(list);
		dt.clone().appendText('Directory :').injectInside(list);
		dd.clone().setProperties({id:'brooser-dir',title:''}).injectInside(list);
		
		new Element('h2').appendText('Preview').injectInside(infos);
		new Element('div',{id:'brooser-preview'}).injectInside(infos);
		
		new Element('a',{
				id:'brooser-close',
				href:'#'
			})
			.appendText('Close')
			.injectInside(brooser);
	},
	
	/*
	Property: bindEvents
		Bind events to Open and Close buttons
	*/
	bindEvents: function() {
		$('brooser-open').removeEvents('click').addEvent('click',this.open.bind(this));
		$('brooser-close').removeEvents('click').addEvent('click',this.close.bind(this));
	},
	
	/*
	Property: open
		Open button event: get selected file, hide browser and exectute onFinish.
	*/
	open: function(e) {
		if(!this.options.currentFile) return false;
		var data;
		if(this.options.targetData=='file') {
			data = this.options.currentFile.name;
		} else {
			data = this.options.currentFile.dir+'/'+this.options.currentFile.name;
		}
		this.hide();
		this.options.onFinish(data);
		new Event(e).stop();
	},
	
	/*
	Property: close
		Close button event: hide browser.
	*/	
	close: function(e){
		this.hide();
		new Event(e).stop();
	},
	
	/*
	Property: setTarget
		Add event on the "open browser" button.
	*/
	setTarget: function() {
			$(this.element).addEvent('click',function() {
				this.setDir(this.options.currentDir);
				this.display();
			}.bind(this));
	},
	
	/*
	Property: display
		Display the overlay and the browser.
	*/
	display: function() {
		this.bindEvents();
		$('brooser-overlay').setStyles({
			display:'block',
			width:window.getWidth()+'px',
			height:window.getHeight()+'px'
		});
		$('brooser').setStyle('display','block');
		
		// Fuck IE
		if(window.ie6) {
			$$('select').setStyle('display','none');
		}
	},
	
	/*
	Property: hide
		Hide the overlay and the browser.
	*/
	hide: function() {
		$('brooser-browser').empty();
		$('brooser-overlay').setStyle('display','none');
		$('brooser').setStyle('display','none');
		
		// Fuck IE
		if(window.ie6) {
			$$('select').setStyle('display','');
		}
	},
	
	/*
	Property: setDir
		Update the current dir.
	*/
	setDir: function(dir) {
		this.options.current=null;
		$('brooser-infos').setStyle('visibility','hidden');
		if(this.XHRRequest) this.XHRRequest.cancel();
		this.XHRRequest = new XHR({
				 onRequest: this.loadingBrowser.bind(this),
				 onSuccess: this.fillDir.bind(this),
				 method:'post'
			})
			.send(this.options.phpFile,
				 'action=browse&dir='+dir+
				 '&time='+(new Date().getTime())
			);
	},
	
	/*
	Property: loadingBrowser
		Set loading state to the browser
	*/
	loadingBrowser: function() {
		$('brooser-browser').empty().addClass('loading');
	},
	
	/*
	Property: loadingPreview
		Set loading state to the preview
	*/
	loadingPreview: function() {
		if($('preview-style'))  $('preview-style').remove();
		if($('preview-script')) $('preview-script').remove();
		$('brooser-preview').empty().addClass('loading');
	},
	
	/*
	Property: fillDir
		Fill the browser with the current directory listing
	*/
	fillDir: function(files) {
		$('brooser-browser').removeClass('loading');
		files = Json.evaluate(files);
		$each(files,function(file) {
			this.options.currentDir=file.dir;
			var a = new Element('a')
						.appendText(file.name)
						.injectInside(
							new Element('li').injectInside($('brooser-browser'))
						)
			if(file.access) {
				a.setProperty('href',file.dir+'/'+file.name)
				 .addEvent('click',function(e) {
					var e = new Event(e).stop();
					// isDir ?
					if(file.mime=='text/directory') {
						this.setDir(this.options.currentDir+'/'+file.name);
						return;
					}
					
					var el = e.getTarget('A');
					this.fillInfos(file);
					if (this.options.current) {
						this.options.current.removeClass('selected');
					}
					el.addClass('selected');
					this.options.current=el;
					this.options.currentFile=file;
				}.bind(this))
			} else {
				a.addClass('denied');
			}
			new Element('img',{
					'src':file.icon
				})
				.injectTop(a);
		},this);
	},
	
	/*
	Property: fillInfos
		Fill the info panel with the selected file infos
	*/
	fillInfos: function(file) {
		$('brooser-infos').setStyle('visibility','');
		$('brooser-preview').empty();
		$$('#brooser-infos img')[0].setProperties({
			src:file.icon,
			alt:file.mime
		});
		$$('#brooser-infos h1')[0].empty().appendText(file.name);
		$('brooser-date').empty().appendText('Modified : '+file.date);
		$('brooser-type').empty().appendText(file.mime);
		var sizeCalc = this.sizeCalc(file.size,true,0);
		$('brooser-size').empty().appendText(sizeCalc+((sizeCalc.search('Bytes')==-1)?' ('+file.size+' Bytes)':''));
		$('brooser-dir' ).empty().appendText(file.dir);
		
		// Preview
		if(this.XHRRequest) this.XHRRequest.cancel();
		this.XHRRequest = new XHR({
				 onRequest: this.loadingPreview.bind(this),
				 onSuccess: this.fillPreview.bind(this),
				 method:'post'
			})
			.send(this.options.phpFile,
				 'action=preview&dir='+file.dir+
				 '&file='+encodeURI(file.name)+
				 '&mimetype='+file.mime+
				 '&time='+(new Date().getTime())
			);
	},
	
	/*
	Property: fillInfos
		Fill the preview panel with the selected file preview
	*/
	fillPreview: function(data) {
		data = Json.evaluate(data);
		
		// Inject styles
		if(data.style.length>0) {
			var style = new Element('style',{id:'preview-style',media:'screen'})
							.setProperty('type','text/css');
			// Fuck IE
			if (window.ie) {
				style.styleSheet.cssText = data.style;
			} else {
				style.appendText(data.style);
			}
			style.injectInside($$('head')[0]);
		}
		// Inject scripts
		if(data.script.length>0) {
			new Element('script',{type:'text/javascript',id:'preview-script'}).appendText(data.script).injectInside($$('head')[0]);
		}
		
		// Inject preview's content
		$('brooser-preview').removeClass('loading');
		$('brooser-preview').setHTML(data.content);
	},
	
	/*
	Property: sizeCalc
		Convert Bytes to KB, MB, GB, etc.
	*/
	sizeCalc: function(size,unit,prec) {
		if (prec === null) {
			prec=2;
		}
		prec = Math.pow(10,prec);		
		var tab = [' Bytes',' KB',' MB',' GB',' TB',' PB'];
		for(var i = 0;size>1024;i++) {
			size=size/1024;
		}
		if (!unit) {
			return Math.round(size*prec)/prec;
		}
		return Math.round(size*prec)/prec+tab[i];
	}
	
});
Brooser.implement(new Options());

/*  
Property: getTarget
	Find the wanted element through the target of the event.

Parameters:
	tag - wanted element's tag
	
Example:
	> html:
	> <a href="example.html"><img id="myimage" src="myimage.gif" alt="my image" /></a>
	> js:
	> $('myimage').addEvent('click', function(e) {
	>  var el = e.getTarget('A');
	>  alert(el.href); // display "example.html"
	> });
*/
Event.implement({	
	getTarget: function(tag) {
		var el = (this.srcElement ? this.srcElement : this.target);
		if (tag) {
			while(el && el.nodeName != tag) {
				el = el.parentNode;
			}
		}
		return el;
	}
});