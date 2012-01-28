var commonScene = function(scene, rttSize) {

    var model = scene;

    var near = 0.1;
    var far = 100;
    var root = new osg.MatrixTransform();

    var quadSize = [ 16/9, 1 ]; 

    // add a node to animate the scene
    var rootModel = new osg.MatrixTransform();
    rootModel.addChild(model);
    //rootModel.setUpdateCallback(new UpdateCallback());

    // create the camera that render the scene
    var camera = new osg.Camera();
    camera.setName("scene");
//    camera.setProjectionMatrix(osg.Matrix.makePerspective(50, quadSize[0], near, far, []));
//    camera.setViewMatrix(osg.Matrix.makeLookAt([ 0, 0, 10], [ 0,   0, 0], [ 0,   1, 0], []));
    camera.setRenderOrder(osg.Camera.PRE_RENDER, 0);
    camera.setReferenceFrame(osg.Transform.RELATIVE_RF);
    camera.setViewport(new osg.Viewport(0,0,rttSize[0],rttSize[1]));
    camera.setClearColor([0.5, 0.5, 0.5, 1]);
    
    // texture attach to the camera to render the scene on
    var rttTexture = new osg.Texture();
    rttTexture.setTextureSize(rttSize[0],rttSize[1]);
    rttTexture.setMinFilter('LINEAR');
    rttTexture.setMagFilter('LINEAR');
    camera.attachTexture(osg.FrameBufferObject.COLOR_ATTACHMENT0, rttTexture, 0);
    camera.attachRenderBuffer(osg.FrameBufferObject.DEPTH_ATTACHMENT, osg.FrameBufferObject.DEPTH_COMPONENT16);
    // add the scene to the camera
    camera.addChild(rootModel);

    // attach camera to root
    root.addChild(camera);
    return [root, rttTexture];
};


var createFilter = function(texture) {

    var getShader = function() {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord0;",
            "varying vec2 FragTexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "void main(void) {",
            "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "  FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform sampler2D Texture0;",
            "uniform vec2 resolution;",
            "uniform vec4 background;",
            "uniform vec4 foreground;",
            "varying vec2 FragTexCoord0;",

            "#define DIFF_MIN 1.0",
            "#define DIFF_MAX 2.0",

            "float getPixel(vec2 uv) {",
            "   vec4 c = texture2D(Texture0, uv);",
            "   return (c[0] + c[1] + c[2])/3.0;",
            "}",

            "void main() {",
            "  vec2 imageCoord = FragTexCoord0;",
            "#if 1",
            "  vec2 uvs[8];",
            "  uvs[0] = imageCoord + vec2(-resolution[0], -resolution[1]);",
            "  uvs[1] = imageCoord + vec2(-resolution[0], 0.0);",
            "  uvs[2] = imageCoord + vec2(-resolution[0], resolution[1]);",
            "  uvs[3] = imageCoord + vec2(0.0, resolution[1]);",
            "  uvs[4] = imageCoord + vec2(resolution[0], resolution[1]);",
            "  uvs[5] = imageCoord + vec2(resolution[0], 0.0);",
            "  uvs[6] = imageCoord + vec2(resolution[0], -resolution[1]);",
            "  uvs[7] = imageCoord + vec2(0.0, -resolution[1]);",
            "  float intensity[8];",
            "  intensity[0] = getPixel(uvs[0]);",
            "  intensity[1] = getPixel(uvs[1]);",
            "  intensity[2] = getPixel(uvs[2]);",
            "  intensity[3] = getPixel(uvs[3]);",
            "  intensity[4] = getPixel(uvs[4]);",
            "  intensity[5] = getPixel(uvs[5]);",
            "  intensity[6] = getPixel(uvs[6]);",
            "  intensity[7] = getPixel(uvs[7]);",

            "  float x = 0.0;",
            "  float corner_0 = DIFF_MIN * intensity[0];",
            "  float corner_1 = DIFF_MIN * intensity[2];",
            "  float corner_2 = DIFF_MIN * intensity[4];",
            "  float corner_3 = DIFF_MIN * intensity[6];",

            "  x += -corner_0;",
            "  x += -DIFF_MAX * intensity[1];",
            "  x += -corner_1;",

            "  x += corner_2;",
            "  x += DIFF_MAX * intensity[5];",
            "  x += corner_3;",

            "  float y = 0.0;",
            "  y += -corner_0;",
            "  y += -DIFF_MAX * intensity[7];",
            "  y += -corner_3;",

            "  y += corner_1;",
            "  y += DIFF_MAX * intensity[3];",
            "  y += corner_2;",
            "  float mag = length(vec2(x,y));",
            "  vec4 color = mix(foreground, background, mag);",
            "  gl_FragColor = color;",
            "#else",
            "  vec4 c = texture2D(Texture0, FragTexCoord0);",
            "  gl_FragColor = c;",
            "#endif",
            "}"
        ].join("\n");


        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        return program;
    };


    var quadSize = [ 16/9, 1 ];

    // add a node to animate the scene
    var root = new osg.MatrixTransform();

    // create a textured quad with the texture that will contain the
    // scene
    var cam = new osg.Camera();
    cam.setReferenceFrame(osg.Transform.ABSOLUTE_RF);
    cam.setProjectionMatrixAsOrtho(-window.innerWidth/2.0,
                                   window.innerWidth/2.0,
                                   -window.innerHeight/2.0,
                                   window.innerHeight/2.0,
                                   -2,2);

    var quad = osg.createTexturedQuadGeometry(-window.innerWidth/2.0, -window.innerHeight/2.0, 0,
                                              window.innerWidth, 0 ,0,
                                              0, window.innerHeight ,0);
    quad.setNodeMask(1);
    var stateSet = quad.getOrCreateStateSet();
    // attach the texture to the quad
    stateSet.setTextureAttributeAndMode(0, texture);
    stateSet.addUniform(osg.Uniform.createFloat2([1.0/window.innerWidth,1.0/window.innerHeight], "resolution"));
    stateSet.addUniform(osg.Uniform.createFloat4([1.0, 1.0, 1.0, 1.0], "foreground"));
    stateSet.addUniform(osg.Uniform.createFloat4([0.0, 0.0, 0.0, 1.0], "background"));

//    stateSet.addUniform(osg.Uniform.createFloat4([1.0, 1.0, 1.0, 1.0], "background"));
//    stateSet.addUniform(osg.Uniform.createFloat4([0.0, 0.0, 0.0, 1.0], "foreground"));

    stateSet.setAttributeAndMode(getShader());

    cam.addChild(quad);
    // attach quad to root
    root.addChild(cam);
    return root;
};


var makeFilter = function(root_scene) {
    return root_scene;
    var rttSize = [window.innerWidth, window.innerHeight];

    var result = commonScene(root_scene, rttSize);
    var commonNode = result[0];
    var texture = result[1];

    var root = new osg.Node();

    var tex_w = osg.Uniform.createFloat1(rttSize[0], "tex_w");
    var tex_h = osg.Uniform.createFloat1(rttSize[1], "tex_h");

    root.getOrCreateStateSet().addUniform(tex_w);
    root.getOrCreateStateSet().addUniform(tex_h);
    root.addChild(commonNode);

    var scene = createFilter(texture);
    scene.setMatrix(osg.Matrix.makeTranslate(0,0,0.0,[]));
    root.addChild(scene);

    return root;
};