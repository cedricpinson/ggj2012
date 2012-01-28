var mainUpdate;

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
  //  try {
        viewer = new osgViewer.Viewer(canvas, {antialias : true, alpha: true });
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
    if (true) {
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.getManipulator().setTarget([CONF.space_width*0.5,CONF.space_height*0.5,0]);
        viewer.getManipulator().setDistance( 20 );
        viewer.getManipulator().update(0,0);

        var getIntersection = function() {
            var hits = viewer.computeIntersections(this.clientX, this.clientY, 2);
            var l = hits.length;
            if (l === 0 ) {
                return undefined;
            }
            hits.sort(function(a,b) {
                return a.ratio - b.ratio;
            });

            // use the first hit
            var hit = hits[0].nodepath;
            var l2 = hit.length;
            var itemSelected;
            var itemID;
            var thit;
            while (l2-- >= 1) {
                if (hit[l2].itemToIntersect !== undefined) {
                    thit = hits[0].triangleHit;
                    itemSelected = hit[l2];
                    point = hits[0].point;
                    break;
                }
            }
            return { 'item': itemSelected,
                     'hit': thit,
                     'point': point
                   };
        };
        viewer.getManipulator().getIntersection = getIntersection;

        var mouseup = function(ev) {
            this.dragging = false;
            this.panning = false;
            this.releaseButton(ev);
            var hits = this.getIntersection();
            var hit = hits.hit;
            if (hit) {
                osg.log("hit " + hits.item.getName());
                osg.log("hit point" + hits.point);
		if (hits.point) {
		    mainUpdate.playerInput(hits.point);
		}
            }
        };
        viewer.getManipulator().mouseup = mouseup;

    }

        viewer.run();

 /*   } catch (er) {
        osg.log("exception in osgViewer " + er);
        alert("exception in osgViewer " + er);
    }*/

};

var RootScene;
var createScene = function () {
    var root = new osg.Node();
    var items = new osg.Node();
    RootScene = items;
    root.addChild(items);
    items.setNodeMask(1);

    
    var plane = osg.createTexturedQuadGeometry(0,0,0,
                                               CONF.space_width,0,0,
                                               0,CONF.space_height,0);

    var texture = new osg.Texture();
    texture.setImage(osgDB.readImage('data/bg.png'));
    var m = new osg.Material();
    m.setEmission([1,1,1,1]);
    m.setAmbient([0,0,0,1]);
    m.setDiffuse([0,0,0,1]);
    m.setSpecular([0,0,0,1]);
    plane.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    plane.getOrCreateStateSet().setAttributeAndMode(m);

    plane.setNodeMask(2);
    root.addChild(plane);
    plane.setName("plane");
    plane.itemToIntersect = {};

    mainUpdate = new MainUpdate();
    root.addUpdateCallback(mainUpdate);
    
    $('body').keyup(function(event) {
	mainUpdate.playerInputUp(event);
    });
    $('body').keydown(function(event) {
	mainUpdate.playerInputDown(event);
    });

    // Audio
    var audio = $('#Track01').get(0);   
    /*
      audio.addEventListener('ended', function(){
      audio.currentTime = 0;
      }, true);
      audio.addEventListener('play', function(){
      }, true);
    */
    audio.play();

    
    return makeFilter(root);
    return root;
};

window.addEventListener("load", main ,true);
