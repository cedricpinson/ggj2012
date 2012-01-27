
var MainUpdate = function() {
    this._lastUpdate = undefined;
};

MainUpdate.prototype = {

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (this._lastUpdate === undefined) {
            this._lastUpdate = t;
        }
        var dt = t - this._lastUpdate;

        // here you are at home

        //osg.log("yeah");

        // 
        
        return true;
    }
};