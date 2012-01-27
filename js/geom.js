
var BoidGeometry = function() {
    var mt = new osg.MatrixTransform();

    if (BoidGeometry.stateSet === undefined) {
        BoidGeometry.stateSet = new osg.StateSet();
        var texture = new osg.Texture();
        texture.setImage(osgDB.readImage('data/Black.png'));
        BoidGeometry.stateSet.setTextureAttributeAndMode(0, texture);
    }

    var cube = osg.createTexturedBoxGeometry(0,0,0,
                                             1,1,1);
    cube.setStateSet(BoidGeometry.stateSet);
    mt.addChild(cube);
    this.node = mt;
    RootScene.addChild(this.node);
};

BoidGeometry.prototype = {
    updatePosition: function(pos, vec) {
        //osg.log(pos);
        this.node.dirtyBound();
        var target = [];
        target[0] = pos[0]+vec[0];
        target[1] = pos[1]+vec[1];
        target[2] = pos[2]+vec[2];

        var l = [];
        osg.Matrix.makeLookAt(pos, target,[0,0,1], l);
        osg.Matrix.inverse(l, this.node.getMatrix());
        //osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], this.node.getMatrix());
    }
};

