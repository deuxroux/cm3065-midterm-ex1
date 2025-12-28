//DEFINE GLOBAL VARIABLES
// playback controls
var pausePlayButton;
var stopButton;
var skipStartButton;
var loopButton;

// low-pass filter
var lp_cutOffSlider;
var lp_resonanceSlider;
var lp_dryWetSlider;
var lp_outputSlider;
let lowPass; //low-pass filter object

// dynamic compressor
var dc_attackSlider;
var dc_kneeSlider;
var dc_releaseSlider;
var dc_ratioSlider;
var dc_thresholdSlider;
var dc_dryWetSlider;
var dc_outputSlider;
let compressor; //compressor object

// master volume
var mv_volumeSlider;
let masterVolume; //master volume object

// reverb
var rv_durationSlider;
var rv_decaySlider;
var rv_dryWetSlider;
var rv_outputSlider;
var rv_reverseButton;
let reverb; //reverb object

// waveshaper distortion
var wd_amountSlider;
var wd_oversampleSlider;
var wd_dryWetSlider;
var wd_outputSlider;
let distortion; //waveshaper object

//DEFINE AUDIO variables
var mySound;
var player; //final player
let fftInput;
let fftOutput;

// Sound selection variables
var soundButtons = [];
var selectedSoundIndex = 1; //initialize to counting.wav (preset)
var soundFiles = [];
var recordedSoundFile = null;
var mic;
var recorder = null;
var isRecording = false;
let nowPlaying;

function preload(){
    soundFormats('mp3', 'wav');
    // Default sound - will be replaced when user selects one
    player = loadSound('/assets/Counting.wav');
}

function setup(){

    //create canvas and UI
    createCanvas(1000,800);
    background(180);
    gui_configuration();

    //Establish Audio Chain for processing flow. 
    signal_flow_configuration();

    //configure sound library and now playing window. 
    sounds_configuration();
    init_now_playing();
    init_recording();

    init_FFT();
}

function draw(){
    //read and update variables for all sliders to apply them to the chain segments.
    player.setVolume(mv_volumeSlider.value());

    draw_FFT(560, 220, fftInput, 100, 220);

}

function gui_configuration() {
    // Playback controls
    pausePlayButton = createButton('play');
    pausePlayButton.position(560, 20);
    pausePlayButton.mousePressed(playStopSound);
    stopButton = createButton('stop');
    stopButton.position(660, 20);
    stopButton.mousePressed(stopSound)
    skipStartButton = createButton('skip to start');
    skipStartButton.position(720, 20);
    skipStartButton.mousePressed(stopSound)


    loopButton = createSelect();
    loopButton.option('Loop');
    loopButton.option('Do not Loop');
    loopButton.selected('Loop');
    loopButton.position(820, 20);

    
    // Important: you may have to change the slider parameters (min, max, value and step)
    // low-pass filter
    textSize(14);
    text('low-pass filter', 10,80);
    textSize(10);
    lp_cutOffSlider = createSlider(0, 1, 0.5, 0.01);
    lp_cutOffSlider.position(10,110);
    text('cutoff frequency', 10,105);
    lp_resonanceSlider = createSlider(0, 1, 0.5, 0.01);
    lp_resonanceSlider.position(10,155);
    text('resonance', 10,150);
    lp_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    lp_dryWetSlider.position(10,200);
    text('dry/wet', 10,195);
    lp_outputSlider = createSlider(0, 1, 0.5, 0.01);
    lp_outputSlider.position(10,245);
    text('output level', 10,240);
    
    // dynamic compressor
    textSize(14);
    text('dynamic compressor', 210,80);
    textSize(10);
    dc_attackSlider = createSlider(0, 1, 0.5, 0.01);
    dc_attackSlider.position(210,110);
    text('attack', 210,105);
    dc_kneeSlider = createSlider(0, 1, 0.5, 0.01);
    dc_kneeSlider.position(210,155);
    text('knee', 210,150);
    dc_releaseSlider = createSlider(0, 1, 0.5, 0.01);
    dc_releaseSlider.position(210,200);
    text('release', 210,195);
    dc_ratioSlider = createSlider(0, 1, 0.5, 0.01);
    dc_ratioSlider.position(210,245);
    text('ratio', 210,240);
    dc_thresholdSlider = createSlider(0, 1, 0.5, 0.01);
    dc_thresholdSlider.position(360,110);
    text('threshold', 360,105);
    dc_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    dc_dryWetSlider.position(360,155);
    text('dry/wet', 360,150);
    dc_outputSlider = createSlider(0, 1, 0.5, 0.01);
    dc_outputSlider.position(360,200);
    text('output level', 360,195);
    
    // master volume
    textSize(14);
    text('master volume', 560,80);
    textSize(10);
    mv_volumeSlider = createSlider(0, 1, 0.5, 0.01);
    mv_volumeSlider.position(560,110);
    text('level', 560,105)

    // reverb
    textSize(14);
    text('reverb', 10,305);
    textSize(10);
    rv_durationSlider = createSlider(0, 1, 0.5, 0.01);
    rv_durationSlider.position(10,335);
    text('duration', 10,330);
    rv_decaySlider = createSlider(0, 1, 0.5, 0.01);
    rv_decaySlider.position(10,380);
    text('decay', 10,375);
    rv_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    rv_dryWetSlider.position(10,425);
    text('dry/wet', 10,420);
    rv_outputSlider = createSlider(0, 1, 0.5, 0.01);
    rv_outputSlider.position(10,470);
    text('output level', 10,465);
    rv_reverseButton = createButton('reverb reverse');
    rv_reverseButton.position(10, 510);
    
    // waveshaper distortion
    textSize(14);
    text('waveshaper distortion', 210,305);
    textSize(10);
    wd_amountSlider = createSlider(0, 1, 0.5, 0.01);
    wd_amountSlider.position(210,335);
    text('distortion amount', 210,330);
    wd_oversampleSlider = createSlider(0, 1, 0.5, 0.01);
    wd_oversampleSlider.position(210,380);
    text('oversample', 210,375);
    wd_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    wd_dryWetSlider.position(210,425);
    text('dry/wet', 210,420);
    wd_outputSlider = createSlider(0, 1, 0.5, 0.01);
    wd_outputSlider.position(210,470);
    text('output level', 210,465);
    
    // spectrums
    textSize(14);
    text('spectrum in', 560,200);
    text('spectrum out', 560,345);
  }

  function signal_flow_configuration() {
    compressor = new p5.Compressor();
    distortion = new p5.Distortion();
    reverb = new p5.Reverb();
    lowPass = new p5.LowPass();
  }

  function init_FFT(){
    fftInput = new p5.FFT();
    fftInput.setInput(player);

    fftOutput = new p5.FFT();
  }

  function draw_FFT(startX, startY, fft, fftHeight = 100, fftWidth = 200){
    push();
    noStroke();
    fill(180);                
    rect(startX, startY, fftWidth, fftHeight);
    pop();
  
    // draw spectrum in draw loop
    let spectrum = fft.analyze();
    let barWidth = fftWidth / spectrum.length;
  
    push();
    noStroke();
    fill(255, 0, 0);
    translate(startX, startY);
  
    for (let i = 0; i < spectrum.length; i++){
      let x = i * barWidth;
      let h = map(spectrum[i], 0, 255, 0, fftHeight);
      rect(x, fftHeight, barWidth, -h); // negative draws upward
    }
  
    pop();
    }

  function process_audio() {
    //Disconnect from existing chain if it exists
    if (player.chain) {
        player.disconnect();
        }
    //Add each phase of processing flow
    player.chain([lowPass, distortion, compressor, reverb]); //process the player through the chain
  }

  function sounds_configuration(){
    // Initialize sound file list from assets folder
    // List of dummy files found in the assets folder
    soundFiles = [
        'Call_security.wav',
        'Counting.wav',
        'go_go_go.wav',
        'Lexie_try_again.wav',
        'Somebody.wav',
    ];

    //create buttons with positions
    var startX = 250;
    
    // Create label using paragraph element
    text('Select Sound:', startX, 560 - 30);
    
    // Create button for each sound file
    for (var i = 0; i < soundFiles.length; i++) {
        var btn = createButton(soundFiles[i]);
        btn.position(startX, 560 + 30*i);
        btn.mousePressed(function(index) {
            return function() {
                selectSound(index);
            };
        }(i));
    }
    
    // Create button for recorded sound option
    var recordLabelBtn = createButton('Recorded Sound');
    recordLabelBtn.position(startX, 560 + 30*(soundFiles.length));
    recordLabelBtn.mousePressed(function() {
        if (recordedSoundFile && recordedSoundFile.buffer) {
            selectRecordedSound();
        } else {
            alert('No recorded sound available. Please record a sound first.');
        }
    });
    
    // Create record control button (separate from playback record button)
    recordButton = createButton('Start Recording');
    recordButton.position(startX-180, 560);
    recordButton.mousePressed(start_recording);
    stopRecordButton = createButton('Stop Recording');
    stopRecordButton.position(startX-180, 560 +60);
    stopRecordButton.mousePressed(stop_recording);
}

function update_now_playing(track_index){
    nowPlaying.html(soundFiles[track_index]);
}

function init_now_playing(){
    text('NOW PLAYING:', 560,150);
    nowPlaying = createP('Counting.wav');
    nowPlaying.position(680, 130);
}

function playStopSound(){ 
    if(player.isPlaying()){
        player.pause();
        pausePlayButton.html('play');
    } else if(loopButton.value() == 'Loop') {
        player.loop();
        pausePlayButton.html('pause');
        console.log('is looping');
    } else{
        player.play();
        pausePlayButton.html('pause');
        console.log('is not looping');
    }
    update_now_playing(selectedSoundIndex);
}

function stopSound(){
    player.stop();
    pausePlayButton.html('play');
}

function selectSound(index){
    selectedSoundIndex = index; 

    reload_player(soundFiles[index])

    // init_FFT();
    // draw_FFT(560,220,fftInput, 100, 220);
}

function reload_player(filename){
    const path = '/assets/' + filename;
    if(player) player.stop() //stop old sound so no overlap happens
    player=loadSound(path);
    fftInput.setInput(player);
    update_now_playing(selectedSoundIndex);
    pausePlayButton.html('play');
}

function init_recording(){
    mic = new p5.AudioIn();
    recorder = new p5.SoundRecorder();
}

function start_recording(){
    mic.start(() => {
        recorder.setInput(mic);
        recordedSoundFile = new p5.SoundFile();
    
        recorder.record(recordedSoundFile);
        console.log('Recording started');
    }) //callback function to init mic and record to sound file. 
}

function stop_recording(){
    if (!recordedSoundFile) return; //if no record exists, do nothing
    recorder.stop();
    console.log('Recording stopped');
}

function selectRecordedSound(){
    if (!recordedSoundFile) return; //if no record exists, do nothing

    if(player) player.stop();
    player = recordedSoundFile; //update player to the p5 sound object

    fftInput.setInput(player);

    nowPlaying.html('Recorded Sound');
}