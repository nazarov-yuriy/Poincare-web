/**
 * Created with JetBrains WebStorm.
 * User: firefish
 * Date: 23/05/13
 * Time: 01:18
 * To change this template use File | Settings | File Templates.
 */
var ctx;
var pxim;
var px;

var pos = 0;
var active_workers_count = 0;
var NumOfTrajectories = 0;
var points = [];
var myWorkers = [];
var all_text = '';
var NumPointsOnMap;
var StepIntegr;
var G;
var TolIntegr;
var TolOfSection;
var PI = 3.1415926535897932384626433832795029;

function proc(){
    if(NumOfTrajectories<=0){
        alert("No one trajectory start point loaded. Please open file with points.");
        return;
    }
    for(var i = 0; i < 4; i++){
        var input = new Object();
        input.NumPointsOnMap = NumPointsOnMap;
        input.StepIntegr     = StepIntegr;
        input.G              = G;
        input.TolIntegr      = TolIntegr;
        input.TolOfSection   = TolOfSection;
        input.x = points[pos];
        input.num = pos;
        input.thread = i;
        pos++;
        active_workers_count++;

        myWorkers[i] = new Worker("worker.js");
        myWorkers[i].onmessage = function (oEvent) {
            console.log("Processing trajectory #"+oEvent.data.num+" done.");
            if(pos < NumOfTrajectories){
                var inp = new Object();
                inp.NumPointsOnMap = NumPointsOnMap;
                inp.StepIntegr     = StepIntegr;
                inp.G              = G;
                inp.TolIntegr      = TolIntegr;
                inp.TolOfSection   = TolOfSection;
                inp.x = points[pos];
                inp.num = pos;
                inp.thread = oEvent.data.thread;
                myWorkers[oEvent.data.thread].postMessage(inp);
                pos++;
            }else{
                active_workers_count--;
            }

            var str = "";
            var w = ctx.canvas.width;
            var h = ctx.canvas.height;
            for(var i = 0; i<NumPointsOnMap; i++){
                var x = w*oEvent.data.points[2*i]/2/PI;
                var y = -h*oEvent.data.points[2*i+1]/2+h/2;
                ctx.putImageData( pxim, x, y );
            }

            var el = document.getElementById("status");
            if(pos-active_workers_count == NumOfTrajectories){
                el.innerHTML = "<a href=\""+ctx.canvas.toDataURL("image/png")+"\">Download result<a>";
            }else{
                el.innerHTML = ""+(pos-active_workers_count)+"/"+NumOfTrajectories;
            }
        };
        myWorkers[i].postMessage(input);
    }
}

function parse(text){
    var lines = text.split(/[\n\r]+/);
    var parts = lines[3].split(/ +/);
    NumOfTrajectories = parseInt(parts[0]);
    NumPointsOnMap    = parseInt(parts[1]);
    StepIntegr        = parseFloat(parts[2]);
    TolIntegr         = parseFloat(parts[3]);
    TolOfSection      = parseFloat(parts[4]);
    G                 = parseFloat(lines[6]);

    if( isNaN(NumOfTrajectories) ){
        window.alert("Count is not a number.");
    } else if(9+3*NumOfTrajectories != lines.length){
        window.alert("Count is not equal real elements count.");
    } else {
        for(var i = 0; i < NumOfTrajectories; i++){
            var parts = lines[9+3*i].split(/ +/);
            points[i] = [parseFloat(parts[1]), parseFloat(parts[2])];
        }
    }
    var el = document.getElementById("status");
    el.innerHTML = "0/"+NumOfTrajectories;
}

function parse_file(fileinput){
    var files = fileinput.files;

    if (!files.length) {
        alert('Please select a file!');
        return;
    }

    var file = files[0];
    var start = 0;
    var stop = file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) {
            parse(evt.target.result);
        }
    };

    var blob = file.slice(start, stop + 1);
    reader.readAsBinaryString(blob);
}

function load(){
    var d=document.getElementById("divCanvas");
    var c=document.getElementById("myCanvas");
    ctx=c.getContext("2d");
    ctx.canvas.width  = d.clientWidth;
    ctx.canvas.height = d.clientHeight-4;
    ctx.fillStyle="#FFF";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    pxim = ctx.createImageData(1,1); // only do this once per page
    px  = pxim.data;                        // only do this once per page
    px[0]   = 0xff;//r
    px[1]   = 0;//g
    px[2]   = 0;//b
    px[3]   = 0xff;//a
}