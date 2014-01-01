/**
* main.js
* JavaScript for Lunar Lander
* Sandra Liljeqvist 2013
* http://sandra.liljeqvist.nu
*/


/** 
 * Shim layer, polyfill, for requestAnimationFrame with setTimeout fallback.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */ 
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
		  window.webkitRequestAnimationFrame || 
		  window.mozRequestAnimationFrame    || 
		  window.oRequestAnimationFrame      || 
		  window.msRequestAnimationFrame     || 
		  function( callback ){
			window.setTimeout(callback, 1000 / 60);
		  };
})();
 
 
/**
 * Shim layer, polyfill, for cancelAnimationFrame with setTimeout fallback.
 */
window.cancelRequestAnimFrame = (function(){
  return  window.cancelRequestAnimationFrame || 
		  window.webkitCancelRequestAnimationFrame || 
		  window.mozCancelRequestAnimationFrame    || 
		  window.oCancelRequestAnimationFrame      || 
		  window.msCancelRequestAnimationFrame     || 
		  window.clearTimeout;
})();


/**
 * Load audio element
 */
var throttleSound = document.createElement('audio');
throttleSound.setAttribute('src', 'audio/pink-noise.mp3');
throttleSound.load();
throttleSound.loop=true;
throttleSound.volume=0.2;
var crashSound = document.createElement('audio');
crashSound.setAttribute('src', 'audio/collision.wav');
crashSound.load();
crashSound.volume=0.2; 


/**
 * Get a random number between min and max
 */
var random = function(min, max) {
	var randNr = ((Math.random()*(max-min+1))+min).toFixed(2);
	return randNr;
}


/**
 * The modulo operation
 */
var mod = function (n, m) {
    var remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
};


/**
 * Keyboard events
 */
var Key = {
	_pressed: {},

	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
  
	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},
  
	onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
	},
  
	onKeyup: function(event) {
		delete this._pressed[event.keyCode];
	}
};

window.addEventListener('keyup', function(event) { 
	Key.onKeyup(event);
	throttleSound.pause();
}, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
	
	
/**
 * All positions and forces 
 */
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};


/**
 * Prototype for the player
 */
function Player(width, height, position, velocity, direction, gravity, wind, gas, breaking) {
  this.height      = height    || 32;
  this.width       = width     || 32;
  this.position    = position  || new Vector();
  this.velocity    = velocity  || new Vector();
  this.direction   = direction || 0;
  this.gravity     = gravity   || new Vector(0, 4);
  this.wind        = wind      || new Vector(1, 0);
  this.gas         = gas       || new Vector(16, 0);
  this.breaking    = breaking  || new Vector(8, 0);
}

Player.prototype.draw = function(ct) {
	ct.save();
	ct.translate(this.position.x, this.position.y);
	ct.rotate(this.direction-Math.PI/2);
	ct.beginPath();
	var radius = this.height/3;
	ct.arc(0, -radius, radius, 0, 2 * Math.PI, false);
	ct.fill();
	ct.rect(-radius, 0, 2*radius, radius);
	ct.fill();
	ct.moveTo(-radius, radius);
	ct.lineTo(-3*radius/2, radius/4);
	ct.lineTo(-2*radius, 1.5*radius);
	ct.lineTo(-5*(radius/2), 1.5*radius);
	ct.moveTo(radius, radius);
	ct.lineTo(3*radius/2, radius/4);
	ct.lineTo(2*radius, 1.5*radius);
	ct.lineTo(5*(radius/2), 1.5*radius);
	
	if (Key.isDown(Key.UP)) {
		ct.moveTo(0,this.height/2-this.height*0.1);
		ct.lineTo(this.width/4, this.height);
		ct.lineTo(0, this.height-this.height*0.1);
		ct.lineTo(-this.width/4, this.height);
		ct.lineTo(0, this.height/2-this.height*0.1);
	}
	
	ct.stroke();
	ct.restore();
};

Player.prototype.move = function(td) {
	this.velocity.x += td * (this.gravity.x + this.wind.x);
	this.velocity.y += td * (this.gravity.y + this.wind.y);
}

Player.prototype.throttle = function(td) {
	this.velocity.x -= this.gas.x * Math.cos(this.direction) * td;
	this.velocity.y -= this.gas.x * Math.sin(this.direction) * td;
}

Player.prototype.breaks = function(td) {
	this.velocity.x += this.breaking.x * Math.cos(this.direction) * td;
	this.velocity.x += this.breaking.x * Math.sin(this.direction) * td;
}
 
Player.prototype.rotateLeft = function() {
	this.direction -= Math.PI/60;
};
 
Player.prototype.rotateRight = function() {
	this.direction += Math.PI/60;
};

Player.prototype.update = function(td) {
	if (Key.isDown(Key.UP)) {
		this.throttle(td);
		throttleSound.play();
	}
	if (Key.isDown(Key.LEFT)) { this.rotateLeft(); }
	if (Key.isDown(Key.DOWN)) { this.breaks(td); }
	if (Key.isDown(Key.RIGHT)) { this.rotateRight(); }
	this.move(td);
	this.position.x += this.velocity.x * td;
	this.position.y += this.velocity.y * td;
};

Player.prototype.updateStats = function(gameboardHeight) {
	var altitude = gameboardHeight-this.position.y-this.height/2;
	document.getElementById('altitude').innerHTML = '<span>ALTITUDE: </span>'+altitude.toFixed(2);
	document.getElementById('velocity').innerHTML = '<span>VELOCITY: </span>'+this.velocity.x.toFixed(2)+', '+this.velocity.y.toFixed(2);
	var modDir = mod( this.direction+3*Math.PI/2, 2*Math.PI ) * (180/Math.PI);
	document.getElementById('direction').innerHTML = '<span>DIRECTION: </span>'+modDir.toFixed()+'&deg;';
};

Player.prototype.stayInArea = function(width, height) {
	if (this.position.x < 0) { 
		this.position.x = width;
	};
	if (this.position.x > width) {
		this.position.x = 0;
	};
	if (this.position.y < 0) {
		this.position.y = 0;
		this.velocity.y = 0;
	};
	if (this.position.y > height-this.height/2) { 
		this.position.y = height-this.height/2;
		return {
			direction: this.direction,
			velocity: this.velocity
		};
	};
	return false;
};

Player.prototype.collisionDetection = function(ctMount1, ctMount2, ctShip, imct, mountObj1, mountObj2) {
	var collision,
		mountDOM1 = document.getElementById('mount1'),
		mountDOM2 = document.getElementById('mount2');
	
	if (this.position.y+this.height/2 >= mountObj1.top && this.position.x+this.height/2 <= mountObj1.width) {
		console.log('ship is in the area of mount1');
		collision = this.pixelDetection(mountDOM1, ctMount1, ctShip, imct, mountObj1);
	} else if (this.position.y+this.height/2 >= mountObj2.top && this.position.x+this.height/2 >= mountObj2.left) {
		console.log('ship is in the area of mount2');
		collision = this.pixelDetection(mountDOM2, ctMount2, ctShip, imct, mountObj2);
	}
	if (collision) {
		return collision;
	};
};

Player.prototype.pixelDetection = function(mountDOM, ctMount, ctShip, imct, mountObj) {
	var mountX1 = mountObj.left;
	var mountY1 = mountObj.top;
	var mountX2 = mountObj.left+mountObj.width;
	var mountY2 = mountObj.top+mountObj.height;
	
	var shipX1 = this.position.x-this.height/2;
	var shipY1 = this.position.y-this.height/2;
	var shipX2 = this.position.x+this.height/2;
	var shipY2 = this.position.y+this.height/2;

	var overlapX1 = mountX1 < shipX1 ? shipX1 : mountX1;
	var overlapY1 = mountY1 < shipY1 ? shipY1 : mountY1;
	var overlapX2 = mountX2 < shipX2 ? mountX2 : shipX2;
	var overlapY2 = mountY2 < shipY2 ? mountY2 : shipY2;
	
	imct.clearRect(overlapX1,overlapY1,overlapX2-overlapX1,overlapY2-overlapY1);
	mountObj.draw(imct);
	var imMount = imct.getImageData(overlapX1,overlapY1,overlapX2-overlapX1,overlapY2-overlapY1);
	
	var resolution = 4*5; //four channels, 5th pixel
	for (var i=0; i<imMount.data.length; i+=resolution) { 
		/*if (imShip.data[i+3]!==0 && imMount.data[i+3]!==0) {*/
		if (imMount.data[i+3]!==0) { //check the transparacy channel
			console.log('collision');
			return true;
		}
	}
};
	

/**
 * Prototype for stars
 */
function Star(radius, position) {
  this.radius   = radius    || 4;
  this.position = position  || new Vector();
}

Star.prototype.draw = function(ct) { 
	ct.beginPath();
	ct.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI, false);
	ct.fill();
};


/**
 * Prototype for mountains
 */
function Mountain(stopPoints, height, width, left, top) {
  this.stopPoints = stopPoints;
  this.height = height;
  this.width = width;
  this.left = left;
  this.top = top;
}

Mountain.prototype.draw = function(ct) { 
	ct.beginPath();
	ct.moveTo(this.stopPoints[0][0], this.stopPoints[0][1]);
	for (var i=0; i<this.stopPoints.length; i++) {
		ct.lineTo(this.stopPoints[i][0], this.stopPoints[i][1]);
	}	
	ct.fill();
	ct.stroke();
};


/**
 * The game
 */
window.Game = (function(){
	var width, height, player, lastGameTick, request, ct, ctBg, ctMount1, ctMount2, 
		ctMount1, ctMount2, imct, mount1, mount2;

	var init = function() {
		var canvas, bgCanvas, mount1Canvas, mount2Canvas, imCanvas, radius, starPosX, starPosY, 
			stars = [], stopPoints, mountHeight, mountWidth, mountLeft, mountTop;
		
		//The ship
	  	canvas = document.getElementById('ship');
	  	ct = canvas.getContext('2d');
	  	width = 800,
	  	height = 400,
	  	ct.lineWidth = 2;
	  	ct.strokeStyle = 'hsla(0,0%,100%,1)';
	  	ct.fillStyle = 'black';
	  	player = new Player(20, 20, new Vector(0, height/10), new Vector(40, 0));
	  	
	  	//stars
		bgCanvas = document.getElementById('background');
		ctBg = bgCanvas.getContext('2d');
		ctBg.fillStyle = 'white';
	  	for (var i=0; i<50; i++) {
			radius = random(0.2, 1.5);
			starPosX = random(0,width);
			starPosY = random(0,height);
			stars[i] = new Star(radius, new Vector(starPosX, starPosY));
			stars[i].draw(ctBg);
		}
		
		//left mountain
		mount1Canvas = document.getElementById('mount1');
		ctMount1 = mount1Canvas.getContext('2d');
		ctMount1.lineWidth = 2;
		ctMount1.strokeStyle = 'white';
		ctMount1.fillStyle = 'black';
		stopPoints = [[0,400],[50,320],[90,340],[105,310],[115,313],[140,280],[155,283],[170,250],[210,310],[220,300],[270,370],[290, 350],[320,400],[0,400]];
		mountHeight = 150;
		mountWidth = 320;
		mountLeft = 0;
		mountTop = 250;
		mount1 = new Mountain(stopPoints, mountHeight, mountWidth, mountLeft, mountTop);
		mount1.draw(ctMount1);
		
		//right mountain
		mount2Canvas = document.getElementById('mount2');
		ctMount2 = mount2Canvas.getContext('2d');
		ctMount2.lineWidth = 2;
		ctMount2.strokeStyle = 'white';
		ctMount2.fillStyle = 'black';
		stopPoints = [[450,400],[500,350],[510,360],[555,310],[565,310],[590,280],[600,285],[620,270],[640,290],[645,285],[680,330],[700,310],[720,350],[750,350],[800,300],[800,400],[0,400]];
		mountHeight = 150;
		mountWidth = 350;
		mountLeft = 450;
		mountTop = 250;
		mount2 = new Mountain(stopPoints, mountHeight, mountWidth, mountLeft, mountTop);
		mount2.draw(ctMount2);
		
		//Imaginary canvas
		imCanvas = document.getElementById('imCanvas');
		imct = imCanvas.getContext('2d');
		imct.lineWidth = 2;
		imct.strokeStyle = 'white';
		imct.fillStyle = 'white';
		
	  	console.log('Init the game');
	};
	
	
	var update = function(td, request) {
		var stats, collision;
	  	player.update(td);
	  	stats = player.stayInArea(width, height);
	  	if (stats) { checkGameStatus(stats); };
	  	collision = player.collisionDetection(ctMount1, ctMount2, ct, imct, mount1, mount2);
	  	if (collision) { gameOver(collision); };
	  	player.updateStats(height);
	};
	
	var render = function() {
	  	ct.clearRect(0,0,width,height);
	  	player.draw(ct);
	};
	
	var gameLoop = function() {
	  	var now = Date.now();
		td = (now - (lastGameTick || now))/1000; // Timediff since last frame / gametick
		lastGameTick = now;
		request = requestAnimFrame(gameLoop);
		update(td, request);
		render();
	};
	
	var checkGameStatus = function(stats) {
		var dir = stats.direction % (2*Math.PI),
			dirMin = Math.PI/2*0.9,
			dirMax = Math.PI/2*1.1,
			speedDown = stats.velocity.y;
		if ((dir > dirMin && dir < dirMax) && (speedDown < 8)) {
			gameOver(false);
		} else {
			gameOver(true);
		}
	};
	
	var gameOver = function(loose) {
		var winMessage = document.getElementById('winMessage');
		if (loose) {
			console.log('You lose');
			crashSound.play();
			winMessage.innerHTML = 'GAME OVER';
		} else {
			console.log('You win');	
			winMessage.innerHTML = 'YOU WON';
		}
		winMessage.innerHTML += '<br/><a href="index.html">PLAY AGAIN</a>';
		document.getElementById('overlay').style.display = 'block';
		cancelRequestAnimFrame(request);
	};
	
	return {
		'init': init,
		'gameLoop': gameLoop
	}
})();


/**
 * Disable scrolling with arrows
 */
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);


/**
 * Start the game
 */
(function(){
	Game.init();
	Game.gameLoop();
	console.log('Ready to play.');  
})();

