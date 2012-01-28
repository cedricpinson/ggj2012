
var BoidGeometry = function() {
    var mt = new osg.MatrixTransform();
    var model, cube;
    if (BoidGeometry.stateSet === undefined) {
        BoidGeometry.stateSet = new osg.StateSet();
        var texture = new osg.Texture();
        texture.setImage(osgDB.readImage('data/Black.png'));
        BoidGeometry.stateSet.setTextureAttributeAndMode(0, texture);
        model = new osg.MatrixTransform();
        model.setMatrix(osg.Matrix.makeScale(0.01, 0.01, 0.01, []));
        model.itemToIntersect = { name: 'model'};
        jQuery.getJSON('data/monster.osgjs', function(data) {
            var m = osgDB.parseSceneGraph(data);
            m.setName("model_data");
            model.addChild(m);
            model.setName("model_instance");
        });

        BoidGeometry.model = model;
        cube = osg.createTexturedBoxGeometry(0,0,0,
                                                 1,1,1);
        cube.setName("cube_data");
        BoidGeometry.cube = cube;

        var m = new osg.Material();
        m.setDiffuse([1,0,1,1]);
        mt.getOrCreateStateSet().setAttributeAndMode(m);
    } else {
        mt.setStateSet(BoidGeometry.stateSet);
    }

    var geom = BoidGeometry.cube;
    mt.addChild(geom);
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

