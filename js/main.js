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
        viewer.getManipulator().setTarget([CONF.space_width*0.5,CONF.space_height*0.5,0]);
        viewer.getManipulator().setDistance( 20 );
        viewer.getManipulator().update(0,0);

        viewer.run();

    } catch (er) {
        osg.log("exception in osgViewer " + er);
        alert("exception in osgViewer " + er);
    }

};

var RootScene;
var createScene = function () {
    var root = new osg.Node();
    RootScene = root;
    
    mainUpdate = new MainUpdate();
    root.addUpdateCallback(mainUpdate);

    $('#3DView').mousemove(mainUpdate.playerInput);

    return root;
};

window.addEventListener("load", main ,true);
