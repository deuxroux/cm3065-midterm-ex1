var mySound;
var playStopButton
let sliderVolume;
let sliderRate;
let sliderPan;
let jumpButton

function preload(){
    soundFormats('mp3', 'wav')
    mySound = loadSound('/assets/interlude');
}

function setup(){

    createCanvas(400,200);
    background(180);
    playStopButton = createButton('play');
    playStopButton.position(200,20);
    playStopButton.mousePressed(playStopSound);

    jumpButton = createButton('jump');
    jumpButton.position(200, 80);
    jumpButton.mousePressed(jumpSound);

    sliderVolume = createSlider(0, 2, 1, 0.01)
    sliderVolume.position(20, 20)
    text('VOL', 0, 20);

    sliderRate=createSlider(-2,2,1,0.01)
    sliderRate.position(20, 80)
    text('RATE', 0 ,80)

    sliderPan=createSlider(-1,1,0,0.01)
    sliderPan.position(20, 140)
    text('PAN', 0 ,140)
}

function playStopSound(){ 
    if(mySound.isPlaying()){
        mySound.stop();
        playStopButton.html('play');
    } else {
        mySound.loop();
        playStopButton.html('stop');
    }
    console.log(getAudioContext().state);
}

function jumpSound(){
    let dur = mySound.duration();
    let t = random(dur);
    mySound.jump(t);
}


function draw(){
    mySound.setVolume(sliderVolume.value());
    mySound.rate(sliderRate.value());
    mySound.pan(sliderPan.value());
}