var lowClick, highClick;
var slider, playButton;
var tempo = 120;
var osc = new p5.Oscillator();
var key;
var playing = false;
var noteValue = 4;
var octaveUp = true;
var octaveValue = 1;
var tick = 0;


function setup() {
    createCanvas(200,200);
    slider = createSlider(0,1,0.5,0.01);
    //lowClick = loadSound("audio/low-click-trimmed.mp3");
    //highClick = loadSound("audio/high-click.mp3");
    chooseKey();
    button = createButton("Play");
    button.mousePressed(togglePlaying);
    osc.addPreProcessing;
}

function draw() {
    background(0);
    //lowClick.setVolume(slider.value());
    //highClick.setVolume(slider.value());
}

function togglePlaying() {
/*     if (!lowClick.isPlaying()) {
      lowClick.loop();
      button.html("Stop");
    } else {
        lowClick.stop();
        button.html("Play");
    } */
    if(!playing ) {
        button.html("Stop");
        osc.start();
        osc.stop(0.1);            
        playing = true;
    } else {
        osc.stop();
        button.html("Play");
        playing = false;
    }

}

/* function changeTempo() {
    tempo = document.getElementById("tempo-input").value;
    console.log(tempo);
    part.setBPM(tempo);
} */

function chooseKey() {
    key = 200;
    if(octaveUp) {
        key = osc.freq(key * 2 * octaveValue)
    }
    osc.freq(key);
}
 
function addPreProcessing(){
    tickCounter = tickCounter + 1 * tempo / 60;

    if (tickCounter >= 1){
        tickCounter = 0;
        tick = (tick + 1) % notesPerBeat;
    }
}