var mainUpdate;
var Viewer;
var Target;
var PlayerMe;


function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

var url = function() {
    var vars = getUrlVars();
    osg.log(vars);
    if (vars.level !== undefined) {
        mainUpdate.initLevel('Level '+ vars.level.toString());
    }

};


var goToMainMenu = function() {
    $("#Credit").fadeOut("slow");
    $("#TeamCredits").fadeOut("slow");
    $("#MainMenu").fadeIn("slow");
    $("#Splash").fadeIn("slow");
    $("#Won").fadeOut();
};

var startGamePage = function() {
    $("#MainMenu").fadeOut("slow");
    $("#Splash").fadeOut("slow");
    $("#Levels").fadeIn("slow");
    $("#Menu").fadeIn("slow");
};

var creditsPage = function() {

    $("#Credit").fadeIn("slow");
    $("#TeamCredits").fadeIn("slow");
    $("#MainMenu").fadeOut("slow");
    $("#Splash").fadeOut("slow");
    $("#Won").fadeOut();
};

var main = function() {

    var canvas = document.getElementById("3DView");
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log("size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    $("#Won").click(function() {
        document.location.reload();
    });

    var stats = document.getElementById("Stats");

    var viewer;
  //  try {
    viewer = new osgViewer.Viewer(canvas, {antialias : true, alpha: true, premult: false });
    viewer.init();
    Viewer = viewer;
    var rotate = new osg.MatrixTransform();
    var root = createScene();
    rotate.addChild(root);
    viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
    osg.Matrix.makePerspective(50, window.innerWidth/window.innerHeight, 1.0, 200.0, viewer.getCamera().getProjectionMatrix());
    viewer.getCamera().setComputeNearFar(false);


    viewer.setSceneData(rotate);
    if (true) {
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.getManipulator().setTarget([CONF.space_width*0.5,CONF.space_height*0.5,0]);
        viewer.getManipulator().setDistance( 20 );
        viewer.getManipulator().update(0,0);

        var UpdateCameraInverseMatrix = function() {
            var cameraInverseUniform = osg.Uniform.createMatrix4(osg.Matrix.makeIdentity([]),'CameraInverseMatrix');
            var time = osg.Uniform.createFloat1(0.0, "time");
            this.time = time;
            this.cameraInverseUniform = cameraInverseUniform;

            viewer.getCamera().getOrCreateStateSet().addUniform(cameraInverseUniform);
            viewer.getCamera().getOrCreateStateSet().addUniform(time);

            this.update = function(node, nv) {
                var t = nv.getFrameStamp().getSimulationTime();
                this.time.get()[0] = t;
                this.time.dirty();

                var matrix = viewer.getManipulator().getInverseMatrix();
                var inv = [];
                osg.Matrix.inverse(matrix, inv);
                this.cameraInverseUniform.set(inv);

                if (false && Target) {

                    Target.dirtyBound();
                    viewer.getManipulator().setNode(Target);
                    viewer.getManipulator().setDistance(2);
                    viewer.getManipulator().update(0,0);
                }
                return true;
            };
        };

	var eye;
	var count;
        if (true) {
            viewer.getManipulator().getInverseMatrix = function() {
                var inv = osg.Matrix.makeIdentity([]);
                if (Target && PlayerMe) {
                    
                    var FACTOR = 100;

                    var mtx = Target.getWorldMatrices();
                    var pos = [];
                    osg.Matrix.getTrans(mtx[0], pos);
		    if (count === undefined) {
		        count = PlayerMe.count+1 || 1;
		    } else {
		        count -= (count-(PlayerMe.count+1||1))/FACTOR;
		    }

		    count = Math.min(count, 10);

                    if (eye === undefined) {
		        eye = [];
                        eye[0] = pos[0] - (20*PlayerMe.v[0]);
                        eye[1] = pos[1] - (20*PlayerMe.v[1]);
                        eye[2] = 10 + count*2;
		    } else {
                        eye[0] -= (eye[0] - (pos[0] - ((10+count*2)*PlayerMe.v[0])))/FACTOR;
                        eye[1] -= (eye[1] - (pos[1] - ((10+count*2)*PlayerMe.v[1])))/FACTOR;
		        eye[2] = (10 + count*2);
		    }

                    var up = [0, 0, 1];
                    //up[0] = PlayerMe.v[0];
                    //up[1] = PlayerMe.v[1];
                    //up[2] = 0;
                    osg.Matrix.makeLookAt(eye,
                                          pos,
                                          up, 
                                          inv);
                }
                return inv;
            };
        }
                    

        root.addUpdateCallback(new UpdateCameraInverseMatrix());

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
        //viewer.getManipulator().getIntersection = getIntersection;

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
        //viewer.getManipulator().mouseup = mouseup;

    }

//        viewer.run();

    viewer.getManipulator().keyup = function(event) {
	mainUpdate.playerInputUp(event);};

    viewer.getManipulator().keydown = function(event) {
	mainUpdate.playerInputDown(event);};


    url();



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

    var bg = new osg.Node();

    var size = CONF.space_width*1.2;
    var plane = osg.createTexturedQuadGeometry(-size*0.5 + CONF.space_width/2, -size*0.5 + CONF.space_height/2,-0.01,
                                               size,0,0,
                                               0,size,0);

    var texture = new osg.Texture();
    texture.setWrapS(osg.Texture.CLAMP_TO_EDGE);
    texture.setWrapT(osg.Texture.CLAMP_TO_EDGE);
    var depth = new osg.Depth();
    depth.setWriteMask(false);
    plane.getOrCreateStateSet().setAttributeAndMode(depth);

    texture.setImage(osgDB.readImage('data/bg.png'));
    var m = new osg.Material();
    m.setEmission([1,1,1,1]);
    m.setAmbient([0,0,0,1]);
    m.setDiffuse([0,0,0,1]);
    m.setSpecular([0,0,0,1]);
    plane.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    plane.getOrCreateStateSet().setAttributeAndMode(m);
    plane.setNodeMask(2);

    bg.addChild(plane);
    bg.addChild(createSkyBox());
    
    plane.setName("plane");
    plane.itemToIntersect = {};

    root.addChild(bg);

    mainUpdate = new MainUpdate();
    root.addUpdateCallback(mainUpdate);
    
    var audio = $("#Track02").get(0);
    audio.volume=0.5;
    audio.play();

    return makeFilter(root);
    return root;
};

window.addEventListener("load", main ,true);
