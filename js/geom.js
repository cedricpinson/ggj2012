var loadModel = function(url) {
    if (loadModel.models[url] === undefined) {

        var model = new osg.MatrixTransform();
        model.setMatrix(osg.Matrix.makeRotate(Math.PI, 1.0, 0.0, 0.0, []));

        jQuery.getJSON(url, function(data) {
            var m = osgDB.parseSceneGraph(data);
            m.setName(url);
            model.addChild(m);
            model.setName(url + "_instance");
        });
        loadModel.models[url] = model;
    }

    return loadModel.models[url];
};
loadModel.models = {};

var getRandomModel = function() {
    if (getRandomModel.loaded === undefined) {
        loadModel("data/arbre.osgjs");
        loadModel("data/bilboquet.osgjs");
        loadModel("data/bite.osgjs");
        loadModel("data/blob.osgjs");
        loadModel("data/calebasse.osgjs");
        loadModel("data/cromosome.osgjs");
        loadModel("data/gamin.osgjs");
        loadModel("data/goo.osgjs");
        loadModel("data/tomb.osgjs");
        loadModel("data/tulip.osgjs");
    }
    var node = new osg.Node();
    var keys = Object.keys(loadModel.models);
    var index = Math.floor((Math.random() * keys.length));
    var selected = keys[index];
    return loadModel(selected);
};

var getMonsterDefault2 = function() {
    var model = new osg.Node();
    jQuery.getJSON('data/arbre.osgjs', function(data) {
        var m = osgDB.parseSceneGraph(data);
        m.setName("arbre_data");
        model.addChild(m);
        model.setName("arbre_instance");
    });
    return model;
};



var BoidGeometry = function() {
    var mt = new osg.MatrixTransform();
    var model, cube;
    if (BoidGeometry.stateSet === undefined) {
        BoidGeometry.stateSet = new osg.StateSet();
        //var texture = new osg.Texture();
        //texture.setImage(osgDB.readImage('data/Black.png'));
        //BoidGeometry.stateSet.setTextureAttributeAndMode(0, texture);
        //model.setMatrix(osg.Matrix.makeScale(0.01, 0.01, 0.01, []));
        //model.itemToIntersect = { name: 'model'};
        
        var model = new osg.Node();
        model.addChild(getRandomModel());

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

    var geom = getRandomModel(); //BoidGeometry.model;
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

