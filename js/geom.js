
var BoidGeometry = function() {
    var mt = new osg.MatrixTransform();
    var cube = osg.createTexturedBoxGeometry(0,0,0,
                                             1,1,1);
    mt.addChild(cube);
    this.node = mt;
    RootScene.addChild(this.node);
};

BoidGeometry.prototype = {
    updatePosition: function(pos) {
        //osg.log(pos);
        this.node.dirtyBound();
        osg.Matrix.makeTranslate(pos[0], pos[1], pos[2], this.node.getMatrix());
    }
};