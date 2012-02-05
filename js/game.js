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

    player_rot: 2.0,
    player_rot_max: 5.0,
    player_speed: 6.0,
    key_step: 1,
    min_chain: 4,
    chain_timer: 1.0,

    white_kill_d: 1.0,

    WHITE: 1,
    BLACK: 2,

    boids_nbr: { 1: 25,
		 2: 75 }
};

var levels = {
    "Level 1" : { 1: 0,
		  2: 75 },
    "Level 2" : { 1: 0,
		  2: 75 },
    "Level 3" : { 1: 0,
		  2: 75 },

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

var score = 0;
var whites = 0;

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

function updateExplode(boid, dt, t) {

    if (boid.explode) {
        var myt = osgAnimation.EaseInQuad(Math.max(0.0,(boid.explodeTime-t)));
        boid.pos[0] = boid.pos[0]+dt*30*myt*myt*boid.explode[0];
        boid.pos[1] = boid.pos[1]+dt*30*myt*myt*boid.explode[1];
        boid.pos[2] = boid.pos[2]; //+dt*20*myt*boid.explode[2] - 9.81*dt;

        //myt = osgAnimation.EaseOutQuad(Math.max(0.0,(boid.explodeTime-t)));
        boid.v[0] = boid.srcdir[0] + (1.0-myt)*(boid.newdir[0]-boid.srcdir[0]);
        boid.v[1] = boid.srcdir[1] + (1.0-myt)*(boid.newdir[1]-boid.srcdir[1]);
        boid.v[2] = 0.0;

        osg.Vec3.normalize(boid.v, boid.v);

        if (t > boid.explodeTime ) {
            delete boid.explode;
        }
        return true;
    }

    return false;
}

var BoidLevel = {
    "data/stop.osgjs": 0,
    "data/bilboquet.osgjs": 1,
    "data/bite.osgjs": 2,
    "data/arbre.osgjs": 3,
    "data/blob.osgjs": 4,
    "data/calebasse.osgjs": 5,
    "data/cromosome.osgjs": 6,
    "data/hero.osgjs": 7,
    "data/gamin.osgjs": 8,
    "data/goo.osgjs": 9,
    "data/tomb.osgjs": 10,
    "data/tulip.osgjs": 11
};

function computeMaxLink(player) {
    var counter = 0;
    var next = player.child;
    while(next) {
	next = next.child;
        counter++;
    }
    if (counter > computeMaxLink.maxValue) {
        osg.log("new record, you linked " + counter + " monster");
        computeMaxLink.maxValue = counter;
    }
}
computeMaxLink.maxValue = 0;

function newBoid(id, x, y, u, v, color, url) {
    var col = color == CONF.WHITE ? "white" : "black";
    var g = new BoidGeometry(col, url);
    var boid = {
	id: id,
	pos: [ x, y, 0 ],
	v: [ u, v, 0 ],
	speed: CONF.boid_speed,
        geom: g,
	color: color,
        power: 0
    };
    boid.originalSpeed = CONF.boid_speed;

    boid.update = function(dt, space, t) {
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

        }

        for(var j=space.boidsList.length-1; j >= 0 ; j--) {
            var b2 = space.boidsList[j];
            if (b1.id === b2.id) {
                continue;
            }
            	    
            if (b1.color === CONF.BLACK && b2.anchor !== undefined && b2.child === undefined ) {
                if (osg.Vec3.length(osg.Vec3.sub(b1.pos, b2.anchor, [])) < CONF.boid_grap_dist) {
		    var b3 = b2.parent;
		    var quit = false;
		    while(b3) {
			if (b1 === b3) {
			    quit = true;
			}
			b3 = b3.parent;
		    }
		    if (quit) {
			continue;
		    }

                    b1.locked = true;
		    if (b1.parent) {
			delete b1.parent.child;
		    }
                    b1.parent = b2;
		    if (b2.child) {
			delete b2.child.parent;
		    }
                    b2.child = b1;
                    b1.speed = b2.speed;

		    var bb = b1;
		    while(bb.child) {
			bb = bb.child;
			if (bb === b1) {
			    break;
			}
		    }
		    var bstart = bb;
		    for(count=0; bb !== undefined; count++) {
			bb.count = count;
			bb = bb.parent;
			if (bb === bstart) {
			    break;
			}
		    }

		    var snd = mn_lst[Math.floor(Math.random()*mn_lst.length)]; 
		    osg.log("PLAY "+snd);
		    var audio = $(snd).get(0);
		    audio.currentTime = 0;
		    audio.play();

                    computeMaxLink(space.player1);

                    return;
                }
            }

	    if (b1.parent) {
		continue;
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

    boid.step = function(dt, space, t) {
	var b = boid;
	b.v[2] = 0.0;

        if (updateExplode(boid, dt, t)) {
            boid.geom.updatePosition(boid.pos, boid.v, -(t-boid.explodeTime) );
            return;
        }

        b.speed += dt*boid.originalSpeed;
        if (b.parent) {
            b.speed = Math.min(b.speed, boid.parent.speed);
        } else {
            b.speed = Math.min(b.speed, boid.originalSpeed);
        }

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
    boid.originalSpeed = CONF.player_speed;
    boid.speed = CONF.player_speed;
    boid.vTo = [ boid.v[0], boid.v[1], boid.v[2] ];
    boid.locked = true;
    boid.player = true;

    var explode = function(source, boid) {
        var diff = [];
        diff[0] = boid.pos[0] - source[0];
        diff[1] = boid.pos[1] - source[1];
        diff[2] = boid.pos[2] - (source[2]-1.0);
        boid.explode = diff;
        boid.newdir = [];
        boid.srcdir = [];

        boid.speed = 0;

        boid.srcdir[0] = boid.v[0];
        boid.srcdir[1] = boid.v[1];
        boid.srcdir[2] = 0;
        boid.newdir[0] = diff[0];
        boid.newdir[1] = diff[1];
        boid.newdir[2] = 0;
    };


    var isWhiteInsideChain = function(chain, list) {
        var start = chain;
        var nb = 1;
        var center = [ start.pos[0], start.pos[1], start.pos[2] ];
        var next = start.child;
        while (next !== start && next !== undefined) {
            center[0] += next.pos[0];
            center[1] += next.pos[1];
            center[2] += next.pos[2];
            nb += 1;
            next = next.child;
        }
        
        center[0] /= nb;
        center[1] /= nb;
        center[2] /= nb;

        var maxDistSqr = 0;
        var dist = osg.Vec3.sub(center, start.pos, []);
        maxDistSqr = Math.max(maxDistSqr, osg.Vec3.length2(dist));
        nest = start.child;
        while (next !== start && next !== undefined) {
            osg.Vec3.sub(center, next.pos, dist);
            maxDistSqr = Math.max(maxDistSqr, osg.Vec3.length2(dist));
        }

        var whitetokill = [];

        for (var i = 0, l = list.length; i < l; i++) {
            if (list[i].color === CONF.WHITE) {
                osg.Vec3.sub(center, list[i].pos, dist);
                if (osg.Vec3.length2(dist) < maxDistSqr) {
                    whitetokill.push(list[i]);
                }
            }
        }
        return whitetokill;
    };

    boid.update = function(dt, space, t) {
	
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
			b1.count = 0;
			var snd = mr_lst[Math.floor(Math.random()*mr_lst.length)]; 
			//osg.log("PLAY "+snd);
			var audio = $(snd).get(0);
			audio.currentTime = 0;
			audio.play();
		    } else {
			var c = chains.shift();
			if (c) {
			    score -= c.count;
			    //osg.log(score);
			    killChain(c);
			    var i=0;
			    if (c.count > 4) {
				i=1;
			    } 
			    if (c.count > 7) {
				i=2;
			    }
			    var snd = explosions[i];
			    //osg.log("PLAY "+snd);
			    var audio = $(snd).get(0);
			    audio.currentTime = 0;
			    audio.play();
			}
		    }
                    explode(b2.pos, b1);
                    b1.explodeTime = t+1.0;

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
		    b1.count = 0;
		    chains.unshift(b2);
		    
		    score += b2.count;
		    //osg.log(score);

		    //var count = Math.min(b2.count, 10);
		    
		    delete b1.child;

		    b1.locked = false;
		    setTimeout(function() {
			b1.locked = true;
		    }, 1000);

		    var audio = $('#Ahhh').get(0);   
		    audio.currentTime = 0;
		    audio.play();

                    var whiteElements = isWhiteInsideChain(b2, space.boidsList);
                    if (whiteElements.length > 0) {
                        osg.log("New chain with white elements");
                        osg.log(whiteElements);
			
			var bb;
			
			function wE(b) {
			    b.toKill = true;
			    b.geom.kill(function(){
				b.toDelete = true;
				whites--;
				if (whites === 0) {
				    space.youWon();
				}
			    });
			}
			
			while((bb = whiteElements.shift())) {
			    if (bb && bb.toKill !== true) {
				wE(bb);
			    }
			}
			
                    } else {
			for(var i = 0; i < CONF.white_spawn; i++) {
			    space.newRandomBoid(CONF.WHITE);
			    whites++;
			}
		    }

		    return;
		}
	    }
	}

        

	var ctrl = -space.ctrl[0] + space.ctrl[1];
	//osg.log(ctrl);
	if(ctrl === 0 ) {
	    space.ctrl[2] = 0;
	    return;
	}
	var v = osg.Vec3.cross(boid.v, [0,0,1], []);
	
	space.ctrl[2] += dt*2;
	var rot = CONF.player_rot + space.ctrl[2];
	if (rot > CONF.player_rot_max) {
	    rot = CONF.player_rot_max;
	}
	//osg.log(rot);
	osg.Vec3.mult(v, ctrl, v);
	osg.Vec3.add(boid.v, osg.Vec3.mult(v, dt*rot, []), boid.v);
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
	
	var pos = [ Math.random()-0.5, Math.random()-0.5, 0 ];
	osg.Vec3.normalize(pos, pos);
	osg.Vec3.mult(pos, W/2, pos);
	osg.Vec3.add(pos, [ W/2, H/2, 0], pos);

	if (id === 0) {
	    boid = newPlayer(id++, pos[0], pos[1], 0.5-Math.random(), 0.5-Math.random());
	    space.player1 = boid;
            PlayerMe = space.player1;
	} else {
	    boid = newBoid(id++, pos[0], pos[1], 0.5-Math.random(), 0.5-Math.random(), color);
	}
	space.boidsList.push(boid);
	space.boidsMap[boid.id] = boid;
	return boid;
    };
    
    space.update = function(dt, t) {
	var i;

	for(i=space.boidsList.length-1; i >= 0; i--) {
	    space.boidsList[i].update(dt, space, t);
	}	
	var toDel=false;
	for(i=space.boidsList.length-1; i >= 0; i--) {
            space.boidsList[i].step(dt, space, t);
	    if (space.boidsList[i].toDelete === true) {
		toDel = true;
	    }
        }

	if (toDel === true) {
	    space.boidsList = space.boidsList.filter(function(b) {
		if (b.toDelete === true) {
		    osg.log("removing "+b.id);
		    return false
		}
		return true;
	    });
	}
	
    };
    
    space.youWon = function() {
	osg.log("YOU WON");
        $("#ViewContainer").fadeOut();
	$("#Won").fadeIn("slow");
	$("#BG").fadeIn("slow");
	$("#Track02").get(0).pause();
	$("#WonMusic").get(0).play();
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
        Viewer.run();

	$("#Splash").fadeOut("slow");
	$("#MainMenu").fadeOut("slow");
	$("#Menu").fadeOut("slow");
	$("#BG").fadeOut("slow");
	$("#Levels").fadeOut("slow");
	$("#ViewContainer").fadeIn();

	$("#Track01").get(0).pause();
	$("#Track02").get(0).play();

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
	
	switch(id) {
	case "Level 1":
	    CONF.white_spawn = 1;
	    space.newRandomBoid(CONF.WHITE); // WHITE
	    whites = 1;
	    break;
	case "Level 2":
	    CONF.white_spawn = 2;
	    space.newRandomBoid(CONF.WHITE); // WHITE
	    space.newRandomBoid(CONF.WHITE); // WHITE
	    whites = 2;
	    break;
	case "Level 3":
	    CONF.white_spawn = 3;
	    space.newRandomBoid(CONF.WHITE); // WHITE
	    space.newRandomBoid(CONF.WHITE); // WHITE
	    space.newRandomBoid(CONF.WHITE); // WHITE
	    whites = 3;
	    break;	    
	}
	
	genBoids(CONF.BLACK);
	setTimeout(function() {
	    genBoids(CONF.WHITE);
	}, 10000);
    },
    
    playerInputUp: function(event) {
	if (event.keyCode === 39) {
	    this._space.ctrl[1] = 0;
	} else if (event.keyCode === 37) {
	    this._space.ctrl[0] = 0;
	}/* else if (event.keyCode === 32) {
	    for(var i = 0; i < this._space.boidsList.length; i++) {
		var boid = this._space.boidsList[i];
		if (boid.color === CONF.WHITE) {
		    var self = this;
		    boid.geom.kill(function() {
			boid.toDelete = true;
			whites--;
			if(whites === 0) {
			    self._space.youWon();
			}
		    });
		    break;
		}
	    }
	    
	}*/
    },
    
    playerInputDown: function(event) {
	//osg.log(event);
	if (event.keyCode === 39) {
	    this._space.ctrl[1] = 1;
	} else if (event.keyCode === 37) {
	    this._space.ctrl[0] = 1;
	}
    },

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (this._lastUpdate === undefined) {
            this._lastUpdate = t;
        }
        var dt = t - this._lastUpdate;

        this._lastUpdate = t;
	this._space.update(dt,t);
        
        return true;
    }
};