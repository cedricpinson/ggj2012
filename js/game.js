var CONF = {
    space_width: 10,
    space_height: 10,
    
    boid_speed: 0.001,
    boid_nbr : 10
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
	var boid = newBoid(id++, Math.random()*W, Math.random()*H, Math.random(), Math.random());
	space.boidsList.push(boid);
	space.boidsMap[boid.id] = boid;
	return boid;
    };
    
    space.update = function(dt) {
	
	for(var i=0; i < space.boidsList.length; i++) {
            var b = space.boidsList[i];
            var v = osg.Vec3.mult(b.v, dt*b.speed, []);
            osg.Vec3.add(b.pos, v, b.pos);
            b.geom.updatePosition(b.pos);
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

	this._space.update(dt);
        
        return true;
    }
};