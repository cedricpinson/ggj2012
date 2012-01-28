var CONF = {
    space_width: 100,
    space_height: 100,
    boid_nbr : 100,
    
    boid_speed: 2.0,
    boid_range : 5.0,
    boid_sep: 0.005,
    boid_align: 0.00125,
    boid_cohesion: 0.025
};

function newBoid(id, x, y, u, v) {
    var g = new BoidGeometry();
    var boid = {
	id: id,
	pos: [ x, y, 0 ],
	v: [ u, v, 0 ],
	speed: CONF.boid_speed,
        geom: g
    };
    osg.Vec3.normalize(boid.v, boid.v);
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
	boidsMap: {}
    };

    space.newRandomBoid = function() {
	var boid = newBoid(id++, Math.random()*W, Math.random()*H, 0.5-Math.random(), 0.5-Math.random());
	space.boidsList.push(boid);
	space.boidsMap[boid.id] = boid;
	return boid;
    };
    
    space.update = function(dt) {
	var i;

	for(i=space.boidsList.length-1; i >= 0; i--) {
	    var b1= space.boidsList[i];
	    var sep = [0,0,0];
	    var align = [0,0,0];
	    var cohesion = [0,0,0];

	    for(j=space.boidsList.length-1; j >= 0 ; j--) {
		var b2 = space.boidsList[j];
		if (b1.id === b2.id) {
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
		    //		    osg.log(dot);
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
	}	
	
	for(i=space.boidsList.length-1; i >= 0; i--) {
            var b = space.boidsList[i];
            var v = osg.Vec3.mult(b.v, dt*b.speed, []);
            osg.Vec3.add(b.pos, v, b.pos);
	    
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
	    
            b.geom.updatePosition(b.pos, b.v);
        }
	
    };

    for(var i=0; i < CONF.boid_nbr; i++) {
	space.newRandomBoid();
    }
    return space;
}


var MainUpdate = function() {
    this._lastUpdate = undefined;
    this._space = newSpace();
};

MainUpdate.prototype = {

    playerInput: function(event) {
	// Player inputs go there...
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