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
                    break;
                }
            }
            return { 'item': itemSelected,
                     'hit': thit
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
                var vec1 = osg.Vec3.mult(hit.v1, hit.r1, []);
                var vec2 = osg.Vec3.mult(hit.v2, hit.r2, []);
                var vec3 = osg.Vec3.mult(hit.v3, hit.r3, []);
                var f = [];
                f[0] = vec1[0] + vec2[0] + vec3[0];
                f[1] = vec1[1] + vec2[1] + vec3[1];
                f[2] = vec1[2] + vec2[2] + vec3[2];

                osg.log("hit " + hits.item.getName());
                osg.log("hit point" + f);
            }
        };
        viewer.getManipulator().mouseup = mouseup;

        

        viewer.run();

    } catch (er) {
        osg.log("exception in osgViewer " + er);
        alert("exception in osgViewer " + er);
    }

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
    plane.setNodeMask(2);
    root.addChild(plane);
    plane.setName("plane");
    plane.itemToIntersect = {};

    mainUpdate = new MainUpdate();
    root.addUpdateCallback(mainUpdate);

    $('#3DView').mousemove(mainUpdate.playerInput);

    return makeFilter(root);
    return root;
};

window.addEventListener("load", main ,true);
