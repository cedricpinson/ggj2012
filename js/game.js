var CONF = {
    space_width: 50,
    space_height: 50,

    boid_speed: 2.0,
    boid_range : 5.0,
    boid_sep: 0.005,
    boid_align: 0.0, // 0.00125,
    boid_cohesion: 0.0, //0.025
    boid_anchor_dist: -1.5,
    boid_grap_dist: 1.5,

    player_rot: 5.0,
    player_speed: 6.0,
    key_step: 1,
    min_chain: 3,
    chain_timer: 1.0,

    white_kill_d: 1.0,

    WHITE: 1,
    BLACK: 2,

    boids_nbr: { 1: 25,
		 2: 75 }
};

var levels = {
    "Level 1" : { 1: 0,
		  2: 10 },
    "Level 2" : { 1: 1,
		  2: 20 },
    "Level 3" : { 1: 5,
		  2: 45 },
    "Level 4" : { 1: 25,
		  2: 75 }
};

var mn_lst = [
    "#MonstreNote01",
    "#MonstreNote02",
    "#MonstreNote03",
    "#MonstreNote04",
    "#MonstreNote05",
    "#MonstreNote06",
    "#MonstreNote07",
    "#MonstreNote08",
    "#MonstreNote09",
    "#MonstreNote10",
    "#MonstreNote11",
];

var mr_lst = [
    "#MonstreRire01",
    "#MonstreRire02",
    "#MonstreRire03",
    "#MonstreRire04",
    "#MonstreRire05",
    "#MonstreRire06",
    "#MonstreRire07",
    "#MonstreRire08",
    "#MonstreRire09",
];

var explosions = [
    "#MonstreExplosionMini",
    "#MonstreExplosionMoyen",
    "#MonstreExplosionMaxi",
]

var chains = [];

function killChain(b) {

    function killBoid(bb) {
	var child = bb.child;
	if (bb.player === true) {
	    bb.speed = CONF.player_speed;
	} else {
	    bb.speed = CONF.boid_speed;
	}
	delete bb.parent;
	delete bb.child;
	delete bb.anchor;
	bb.locked = false;
	
	if (bb.player == true) {
	    setTimeout(function() {
		bb.locked = true;
	    }, CONF.chain_timer*1000);
	}
	return child;
    }
    
    var bb = b;
    if (bb.parent) {
	delete bb.parent.child;
    }
    while(bb) {
	child = killBoid(bb);
	bb = child;
    }
}

function newBoid(id, x, y, u, v, color, url) {
    var col = color == CONF.WHITE ? "white" : "black";
    var g = new BoidGeometry(col, url);
    var boid = {
	id: id,
	pos: [ x, y, 0 ],
	v: [ u, v, 0 ],
	speed: CONF.boid_speed,
        geom: g,
	color: color
    };

    boid.update = function(dt, space) {
	var b1 = boid;
	var sep = [0,0,0];
	var align = [0,0,0];
	var cohesion = [0,0,0];
	
        // I am grabbed to a parent boid
	if (b1.parent !== undefined && b1.parent.anchor) {

            var dir = osg.Vec3.sub(b1.pos, b1.parent.anchor, []);
            var d = osg.Vec3.length(dir);

            var parentPosition = osg.Vec3.copy(b1.parent.pos, []);
            var childPosition = osg.Vec3.copy(b1.pos, []);
            var parentAnchor = osg.Vec3.copy(b1.parent.anchor, []);

            // wrap mode
            if (d > CONF.boid_grap_dist * 3) {
		b1.timer += dt;
		if (b1.timer < CONF.chain_timer) {
                    if (dir[0] > 3*CONF.boid_grap_dist) {
			parentPosition[0] += CONF.space_width;
			parentAnchor[0] += CONF.space_width;
                    } else if (dir[0] < -3*CONF.boid_grap_dist) {
			childPosition [ 0 ] += CONF.space_width;
                    }
		    
                    if (dir[1] > 3*CONF.boid_grap_dist) {
			parentPosition [ 1 ] += CONF.space_height;
			parentAnchor[1] += CONF.space_height;
                    } else if (dir[1] < -3*CONF.boid_grap_dist) {
			childPosition [ 1 ] += CONF.space_height;
                    }
		} else { 
		    killChain(b1);
		    return;
		}
            } else {
		b1.timer = 0.0;
	    }
	    
            var childDirection = [];
	    
            osg.Vec3.sub([ (parentPosition[0] + parentAnchor[0]) / 2 ,
                           (parentPosition[1] + parentAnchor[1]) / 2 ,
                           0, 0], childPosition, childDirection);

            osg.Vec3.normalize(childDirection, b1.v);
            
            var p = osg.Vec3.normalize(osg.Vec3.sub(childPosition, parentAnchor, []), []);

            osg.Vec3.sub(childPosition, osg.Vec3.mult(p, osg.Vec3.length(p)*dt, []), b1.pos);

            return;
        }

        for(var j=space.boidsList.length-1; j >= 0 ; j--) {
            var b2 = space.boidsList[j];
            if (b1.id === b2.id) {
                continue;
            }
            	    
            if (b1.color === CONF.BLACK && b1.locked !== true && b1.parent === undefined && b2.anchor !== undefined && b2.child === undefined) {
                if (osg.Vec3.length(osg.Vec3.sub(b1.pos, b2.anchor, [])) < CONF.boid_grap_dist) {
                    b1.locked = true;
                    b1.parent = b2;
                    b2.child = b1;
                    b1.speed = b2.speed;

		    for(var bb=b1, count=0; bb !== undefined; count++) {
			bb.count = count;
			bb = bb.parent;
			if (bb === b1) {
			    break;
			}
		    }

		    var snd = mn_lst[Math.floor(Math.random()*mn_lst.length)]; 
		    osg.log("PLAY "+snd);
		    var audio = $(snd).get(0);
		    audio.currentTime = 0;
		    audio.play();

                    osg.log("LOCKED!");
                    return;
                }
            }

            var dir = osg.Vec3.sub(b1.pos, b2.pos, []);         
            var d = osg.Vec3.length(dir);
            
            if (d > CONF.boid_range) {
                continue;
            }
            
            var dir_n = osg.Vec3.normalize(dir, []);
            
            var dot = osg.Vec3.dot(dir_n, b1.v);
            
            if (b1.id === 0) {
                //                  osg.log(dot);
            }
            
            // separation 
            osg.Vec3.sub(sep, osg.Vec3.mult(dir_n, d, []),  sep);
            
            // alignement 
            osg.Vec3.add(align, b2.v, align);
            
            // cohesion
            osg.Vec3.sub(cohesion, osg.Vec3.sub(b1.v, b2.v, []), cohesion);
            
        }
	// separation
	osg.Vec3.sub(b1.v, 
		     osg.Vec3.mult(sep, CONF.boid_sep, []), 
		     b1.v);
	
	// alignement
	osg.Vec3.add(b1.v,
		     osg.Vec3.mult(osg.Vec3.normalize(align, align), CONF.boid_align, []),
		     b1.v);
	
	// cohesion
	osg.Vec3.add(b1.v,
		     osg.Vec3.mult(cohesion, CONF.boid_cohesion, []),
		     b1.v);
	
	osg.Vec3.normalize(b1.v, b1.v);
    };

    boid.step = function(dt, space) {
	var b = boid;
	b.v[2] = 0.0;
	osg.Vec3.normalize(b.v, b.v);
        var v = osg.Vec3.mult(b.v, dt*b.speed, []);
        var next = osg.Vec3.add(b.pos, v, []);

	var dir = osg.Vec3.sub(next, [space.width/2, space.height/2, 0], [])
	var d = osg.Vec3.length(dir);

	if (d > space.width/2) {
	    osg.Vec3.sub(b.v, osg.Vec3.mult(osg.Vec3.normalize(dir, []), dt*b.speed, []), b.v);
	    var next = osg.Vec3.add(b.pos, v, []);
	}
	

	b.pos = next;
	

	/*
	// X boundary
	if (b.pos[0] > space.width) {
	    b.pos[0] -= space.width;
	} else if (b.pos[0] < 0) {
	    b.pos[0] += space.width;
	}
	
	// Y boundary
	if (b.pos[1] > space.height) {
	    b.pos[1] -= space.height;
	} else if (b.pos[1] < 0) {
	    b.pos[1] += space.height;
	}
	*/
	b.pos[2] = 0.0;

	if (b.locked === true) {
	    b.anchor = [];
	    osg.Vec3.add(b.pos, osg.Vec3.mult(b.v, CONF.boid_anchor_dist, []), b.anchor);
	} else {
	    b.anchor = undefined;
	}

        b.geom.updatePosition(b.pos, b.v);
    };
    

boid.computeAnchorPosition = function(position, result) {
	 osg.Vec3.add(position, osg.Vec3.mult(this.v, CONF.boid_anchor_dist, []), result);
         return result;
     };
    

    osg.Vec3.normalize(boid.v, boid.v);
    return boid;
}

function newPlayer(id, x, y, u, v) {
    var boid = newBoid(id, x, y, u, v, CONF.BLACK, "data/bite.osgjs");
    boid.speed = CONF.player_speed;
    boid.vTo = [ boid.v[0], boid.v[1], boid.v[2] ];
    boid.locked = true;
    boid.player = true;
    boid.update = function(dt, space) {
	
	var b1 = boid;

	for(var j=space.boidsList.length-1; j >= 0 ; j--) {
	    var b2 = space.boidsList[j];
	    if (b1.id === b2.id) {
		continue;
	    }
	    
	    if (b1.protect !== true && b2.color === CONF.WHITE) {
		var dir = osg.Vec3.sub(b1.pos, b2.pos, []);         
		var d = osg.Vec3.length(dir);
		if (d < CONF.white_kill_d) {
		    if (b1.child) {
			killChain(b1);
			var snd = mr_lst[Math.floor(Math.random()*mr_lst.length)]; 
			osg.log("PLAY "+snd);
			var audio = $(snd).get(0);
			audio.currentTime = 0;
			audio.play();
		    } else {
			var c = chains.shift();
			if (c) {
			    killChain(c);
			    var i=0;
			    if (c.count > 4) {
				i=1;
			    } 
			    if (c.count > 7) {
				i=2;
			    }
			    var snd = explosions[i];
			    osg.log("PLAY "+snd);
			    var audio = $(snd).get(0);
			    audio.currentTime = 0;
			    audio.play();
			}
		    }
		    b1.protect = true;
		    setTimeout(function() {
			b1.protect = false;
		    }, 1000);
		    return;
		}
	    }
	    
	    if (b1.child && b2.anchor !== undefined && b2.child === undefined && b1.child !== b2 && b1.count > CONF.min_chain) {
		if (osg.Vec3.length(osg.Vec3.sub(b1.pos, b2.anchor, [])) < CONF.boid_grap_dist) { // MAKE CHAIN
		    
		    b1.child.parent = b2;
		    b2.child = b1.child;
		    b2.count = b1.count;
		    chains.unshift(b2);
		    
		    delete b1.child;
		    var audio = $('#Ahhh').get(0);   
		    audio.currentTime = 0;
		    audio.play();
		    
		    return;
		}
	    }
	}

	space.ctrl[2] /= 1 + (dt*2);
	//boid.speed = CONF.player_speed + (space.ctrl[2]/5);

	//var v = osg.Vec3.sub(boid.v, boid.vTo, []);
	var ctrl = -space.ctrl[0] + space.ctrl[1];
	//osg.log(ctrl);
	if(ctrl === 0 ) {
	    return;
	}
	var v = osg.Vec3.cross(boid.v, [0,0,1], []);

	osg.Vec3.mult(v, ctrl, v);

	osg.Vec3.add(boid.v, osg.Vec3.mult(v, dt*CONF.player_rot, []), boid.v);
	osg.Vec3.normalize(boid.v, boid.v);

    };
    return boid;
}

function newSpace() {
    var id = 0;
    var W = CONF.space_width;
    var H = CONF.space_height;
    var space = {
	width: W,
	height: H,
	boidsList: [],
	boidsMap: {},
	ctrl: [0, 0, 0]
    };
    
    space.newRandomBoid = function(color) {
	var boid;
	if (id === 0) {
	    boid = newPlayer(id++, Math.random()*W, Math.random()*H, 0.5-Math.random(), 0.5-Math.random());
	    space.player1 = boid;
            PlayerMe = space.player1;
	} else {
	    boid = newBoid(id++, Math.random()*W, Math.random()*H, 0.5-Math.random(), 0.5-Math.random(), color);
	}
	space.boidsList.push(boid);
	space.boidsMap[boid.id] = boid;
	return boid;
    };
    
    space.update = function(dt) {
	var i;

	for(i=space.boidsList.length-1; i >= 0; i--) {
	    space.boidsList[i].update(dt, space);
	}	
	
	for(i=space.boidsList.length-1; i >= 0; i--) {
            space.boidsList[i].step(dt, space);
        }
	
    };

    return space;
}

var MainUpdate = function() {
    this._lastUpdate = undefined;
    this._space = newSpace();
};

MainUpdate.prototype = {
    
    playerInput: function(point) {
	//osg.Vec3.normalize(osg.Vec3.sub(this._space.player1.pos, point, []), this._space.player1.vTo);
    },
    
    initLevel: function(id) {
	$("#Menu").hide("slow");

	var space = this._space;
	var produced = { 1: 0,
			 2: 0 }
	function genBoids(color) {
	    if (levels[id][color] > 0) {
		space.newRandomBoid(color);
		produced[color]++;
		if ( produced[color] < levels[id][color]) {
		    setTimeout(function() {
			genBoids(color);
		    }, 2000*Math.random());
		}
	    }
	}

	space.newRandomBoid(CONF.BLACK); // PLAYER
	
	genBoids(CONF.BLACK);
	setTimeout(function() {
	    genBoids(CONF.WHITE);
	}, 10000);
    },
    
    playerInputUp: function(event) {
	//osg.log(event);
	if (event.keyCode === 39) {
	    this._space.ctrl[1] = 0;
	    this._space.ctrl[2]++;
	} else if (event.keyCode === 37) {
	    this._space.ctrl[0] = 0;
	    this._space.ctrl[2]++;
	}
    },
    
    playerInputDown: function(event) {
	//osg.log(event);
	if (event.keyCode === 39) {
	    this._space.ctrl[1] = 1;
	    this._space.ctrl[2]++; 
	} else if (event.keyCode === 37) {
	    this._space.ctrl[0] = 1;
	    this._space.ctrl[2]++;
	}
    },

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (this._lastUpdate === undefined) {
            this._lastUpdate = t;
        }
        var dt = t - this._lastUpdate;

        this._lastUpdate = t;
	this._space.update(dt);
        
        return true;
    }
};