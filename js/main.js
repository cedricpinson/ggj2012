var main = function() {
    var canvas = document.getElementById("3DView");
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log("size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    var stats = document.getElementById("Stats");

    var viewer;
    try {
        viewer = new osgViewer.Viewer(canvas, {antialias : true, alpha: true });
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.run();

    } catch (er) {
        osg.log("exception in osgViewer " + er);
        alert("exception in osgViewer " + er);
    }
};



var createScene = function () {
    var root = new osg.Node();
    
    root.addChild(osg.createTexturedBoxGeometry(0,0,0,
                                                2,2,2));
    
    return root;
};

window.addEventListener("load", main ,true);
