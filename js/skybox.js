var createSkyBox = function() {

    var getShader = function() {
        vertex = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec2 TexCoord1;",
            "",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "",
            "varying vec2 FragTexCoord0;",
            "",
            "vec4 ftransform() {",
            "    mat3 rotate = mat3(vec3(ModelViewMatrix[0]),vec3(ModelViewMatrix[1]),vec3(ModelViewMatrix[2]));",
            "    return ProjectionMatrix * vec4(rotate*Vertex, 1.0);",
            "}",
            "",
            "void main(void) {",
            "    gl_Position = ftransform();",
            "    FragTexCoord0 = TexCoord1;",
            "}"
        ].join('\n');

        fragment = [
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "",
            "varying vec2 FragTexCoord0;",
            "uniform sampler2D Texture1;",
            "",
            "void main(void) {",
            "   gl_FragColor = texture2D( Texture1, FragTexCoord0);",
            "}"
        ].join('\n');

        var program = osg.Program.create(osg.Shader.create(gl.VERTEX_SHADER, vertex),
                                         osg.Shader.create(gl.FRAGMENT_SHADER, fragment));
        return program;
    };

    var model = new osg.MatrixTransform();
    var url = "data/arena.osgjs";
    jQuery.getJSON(url, function(data) {
        var m = osgDB.parseSceneGraph(data);
        if (false) {
            m.getOrCreateStateSet().setAttributeAndMode(getShader(), osg.StateAttribute.OVERRIDE);
            var texture = osg.Uniform.createInt1(1,"Texture1");
            m.getOrCreateStateSet().addUniform(texture);
        }
        m.setName(url);
        model.addChild(m);
        model.setName(url + "_instance");
    });
    
    osg.Matrix.makeTranslate(CONF.space_width*0.5, CONF.space_width*0.5,0, model.getMatrix());
    return model;
};
