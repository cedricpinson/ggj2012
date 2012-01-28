var getTotalEyes = function() {
    return 3;
};

var FindEye = function() {
    osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN); 
    this.init();
};

FindEye.prototype = osg.objectInehrit( osg.NodeVisitor.prototype, {
    init: function() {
        this.found = [];
    },

    apply: function(node) {
        var stateset = node.getStateSet();
        if (stateset) {
            if (stateset.getName() === "eye" ) {
                this.found.push(stateset);
            }
        }
        this.traverse(node);
    }

});

var getBlinkTexture = function() {
    if (getBlinkTexture.texture === undefined) {
        getBlinkTexture.texture = new osg.Texture();
        getBlinkTexture.texture.setImage(osgDB.readImage('data/blink.png'));
    }
    return getBlinkTexture.texture;
};

var UpdateCallbackBlinkEye = function() {
};
UpdateCallbackBlinkEye.prototype = {
    switchEye: function(node) {
        var index = Math.floor(Math.random() * (getTotalEyes() - 0.0001));
        var stateSet = node.getStateSet();
        var uniform = stateSet.getUniform('eye');
        uniform.get()[0] = index;
        uniform.dirty();
    },
    getNextTimeStamp: function() {
        return 0.3 + Math.random() * 1.0;
    },
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();

        if (this.nextSwitch === undefined) {
            this.nextSwitch = t + this.getNextTimeStamp();
        }

        if (t > this.nextSwitch) {
            this.switchEye(node);
            this.nextSwitch = t + this.getNextTimeStamp();
        }
        return true;
    }
};

var loadModel = function(url) {
    if (loadModel.models[url] === undefined) {

        var getShader = function() {
            var vertexshader = [
                "",
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "attribute vec3 Vertex;",
                "attribute vec2 TexCoord1;",
                "varying vec2 FragTexCoord0;",
                "uniform mat4 ModelViewMatrix;",
                "uniform mat4 ProjectionMatrix;",
                "uniform int eye;",
                "float nbEye = 4.0;",
                "void main(void) {",
                "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
                "  vec2 uv = vec2(TexCoord1[0],TexCoord1[1]/nbEye) + float(eye)*1.0/nbEye;",
                "  //uv = vec2(TexCoord1[0],TexCoord1[1]);",
                "  FragTexCoord0 = uv;",
                "}",
                ""
            ].join('\n');

            var fragmentshader = [
                "#ifdef GL_ES",
                "precision highp float;",
                "#endif",
                "uniform sampler2D Texture1;",
                "varying vec2 FragTexCoord0;",

                "void main() {",
                "  vec4 c = texture2D(Texture1, FragTexCoord0);",
                "  gl_FragColor = c;",
                "}"
            ].join("\n");


            var program = new osg.Program(
                new osg.Shader(gl.VERTEX_SHADER, vertexshader),
                new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
            return program;
        };


        var model = new osg.MatrixTransform();
        var s = 3.125;
        var matrix = osg.Matrix.makeScale(s,s,s, []);
        osg.Matrix.postMult(osg.Matrix.makeRotate(Math.PI*0.5, 1.0, 0.0, 0.0, []),matrix);
        osg.Matrix.postMult(osg.Matrix.makeRotate(Math.PI, 0.0, 1.0, 0.0, []),matrix);
        model.setMatrix(matrix);

        jQuery.getJSON(url, function(data) {
            var m = osgDB.parseSceneGraph(data);
            m.setName(url);
            model.addChild(m);
            model.setName(url + "_instance");

            if (loadModel.shader === undefined) {
                loadModel.shader = getShader();
            }
            var eyeFinder = new FindEye();
            model.accept(eyeFinder);
            if (eyeFinder.found.length === 0) {
                osg.log("eye not found in " + url);
            }
            var stateSet = eyeFinder.found[0];
            stateSet.setAttributeAndMode(loadModel.shader);
            stateSet.addUniform(osg.Uniform.createInt1(1,"Texture1"));
            var texture = getBlinkTexture();
            stateSet.setTextureAttributeAndMode(1, texture);
        });
        loadModel.models[url] = model;

    }

    return loadModel.models[url];
};
loadModel.models = {};

var getRandomModel = function(color) {
    if (getRandomModel.loaded === undefined) {
        loadModel("data/stop.osgjs");
        loadModel("data/arbre.osgjs");
        loadModel("data/bilboquet.osgjs");
        loadModel("data/bite.osgjs");
        loadModel("data/blob.osgjs");
        loadModel("data/calebasse.osgjs");
        loadModel("data/cromosome.osgjs");
        loadModel("data/hero.osgjs");
        loadModel("data/gamin.osgjs");
        loadModel("data/goo.osgjs");
        loadModel("data/tomb.osgjs");
        loadModel("data/tulip.osgjs");
    }
    var node = new osg.Node();
    var keys = Object.keys(loadModel.models);
    var index = Math.floor((Math.random() * keys.length));
    var selected = keys[index];

    if (color !== undefined) {
        var material;
        material = new osg.Material();
        if (color === "black") {
            material.setDiffuse([0,0,0,1]);
        } else if (color === "white") {
            material.setDiffuse([1,1,1,1]);
        }
        
        node.getOrCreateStateSet().setAttributeAndMode(material, osg.StateAttribute.OVERRIDE);
    }
    node.addChild(loadModel(selected));
    var eyeSelected = osg.Uniform.createInt1(0, "eye");
    node.getOrCreateStateSet().addUniform(eyeSelected);
    node.addUpdateCallback(new UpdateCallbackBlinkEye());
    
    return node;
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

    var list = ["white", "black"];
    var color = Math.floor(Math.random() * (list.length -0.00001));

    var geom = getRandomModel(list[color]); //BoidGeometry.model;
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

