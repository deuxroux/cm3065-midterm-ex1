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
var rv_isReversed = false;
let reverb; //reverb object

// waveshaper distortion
var wd_amountSlider;
var wd_oversampleSlider;
var wd_dryWetSlider;
var wd_outputSlider;
let distortion; //waveshaper object

//DEFINE AUDIO variables
var player; // sound player
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

//init number of recorded sounds
let recordedSounds = [];
let recordedSoundMetadata = [];

//processing vars
let masterGain;                 // end-of-chain output
let processedRecorder;      
let processedFileToSave = null; // flag for file to be donwloaded
let recordedButtons = [];       // track UI buttons

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

    draw_FFT(560, 220, fftInput, 100, 220);
    draw_FFT(560,365,fftOutput, 100, 200);

}

function gui_configuration() {
    // Playback controls
    pausePlayButton = createButton('play');
    pausePlayButton.position(560, 20);
    pausePlayButton.mousePressed(playStopSound);
    resetButton=createButton('reset fx');
    resetButton.position(660, 20);
    stopButton = createButton('stop');
    stopButton.position(610, 20);
    stopButton.mousePressed(stopSound)
    skipStartButton = createButton('skip to start');
    skipStartButton.position(720, 20);
    skipStartButton.mousePressed(stopSound)


    loopButton = createSelect();
    loopButton.option('Loop');
    loopButton.option('Do not Loop');
    loopButton.selected('Loop');
    loopButton.position(820, 20);

    
    // remapped all ranges to reasonable values. 
    // low-pass filter
    textSize(14);
    text('low-pass filter', 10,80);
    textSize(10);
    lp_cutOffSlider = createSlider(80, 12000, 12000, 100);
    lp_cutOffSlider.position(10,110);
    text('cutoff frequency', 10,105);
    lp_resonanceSlider = createSlider(0.1, 20, 1, 0.01);
    lp_resonanceSlider.position(10,155);
    text('resonance', 10,150);
    lp_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    lp_dryWetSlider.position(10,200);
    text('dry/wet', 10,195);
    lp_outputSlider = createSlider(0, 2, 2, 0.01);
    lp_outputSlider.position(10,245);
    text('output level', 10,240);
    
    // dynamic compressor
    textSize(14);
    text('dynamic compressor', 210,80);
    textSize(10);
    dc_attackSlider = createSlider(0.01, 0.2, 0.1, 0.01);
    dc_attackSlider.position(210,110);
    text('attack', 210,105);
    dc_kneeSlider = createSlider(0, 40, 20, 1);
    dc_kneeSlider.position(210,155);
    text('knee', 210,150);
    dc_releaseSlider = createSlider(0.05, 1.0, 0.5, 0.05);
    dc_releaseSlider.position(210,200);
    text('release', 210,195);
    dc_ratioSlider = createSlider(1, 20, 1, 1);
    dc_ratioSlider.position(210,245);
    text('ratio', 210,240);
    dc_thresholdSlider = createSlider(-60, 0, 0, 1);
    dc_thresholdSlider.position(360,110);
    text('threshold', 360,105);
    dc_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    dc_dryWetSlider.position(360,155);
    text('dry/wet', 360,150);
    dc_outputSlider = createSlider(0, 2, 2, 0.01);
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
    rv_durationSlider = createSlider(0, 5, 0.5, 0.1); //five second delay?
    rv_durationSlider.position(10,335);
    text('duration', 10,330);
    rv_decaySlider = createSlider(0, 10, 0, 0.01); // ten second decay?
    rv_decaySlider.position(10,380);
    text('decay', 10,375);
    rv_dryWetSlider = createSlider(0, 1, 0.5, 0.05);
    rv_dryWetSlider.position(10,425);
    text('dry/wet', 10,420);
    rv_outputSlider = createSlider(0, 2, 2, 0.01);
    rv_outputSlider.position(10,470);
    text('output level', 10,465);
    rv_reverseButton = createButton('rev reverse');
    rv_reverseButton.position(10, 510);
    rv_reverseButton.mousePressed(()=>{
        rv_isReversed = !rv_isReversed;
        rv_reverseButton.html('rv reverse = ' + rv_isReversed)});
    
    // waveshaper distortion
    textSize(14);
    text('waveshaper distortion', 210,305);
    textSize(10);
    wd_amountSlider = createSlider(0, 1, 0.5, 0.01);
    wd_amountSlider.position(210,335);
    text('distortion amount', 210,330);
    wd_oversampleSlider = createSlider(0, 4, 2, 2); 
    wd_oversampleSlider.position(210,380);
    text('oversample', 210,375);
    wd_dryWetSlider = createSlider(0, 1, 0.5, 0.01);
    wd_dryWetSlider.position(210,425);
    text('dry/wet', 210,420);
    wd_outputSlider = createSlider(0, 2, 2, 0.01);
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
  
    //final gain stage-- to be governed by mv slider. 
    masterGain = new p5.Gain();
    masterGain.amp(1.0);

    //each of the stepwise gains
    lpOutGain = new p5.Gain();
    wdOutGain = new p5.Gain();
    dcOutGain = new p5.Gain();
    rvOutGain = new p5.Gain();

  
    // recorder for processed output
    processedRecorder = new p5.SoundRecorder();
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


    //Disconnect from existing chains
    player.disconnect();
    lowPass.disconnect();
    distortion.disconnect();
    compressor.disconnect();
    reverb.disconnect();
    masterGain.disconnect();

    //Add each phase of processing flow connect should add in series.
    //  extra connections are made to mediate the level trim output sliders
    player.connect(lowPass);
    lowPass.connect(lpOutGain);
    lpOutGain.connect(distortion);
    distortion.connect(wdOutGain);
    wdOutGain.connect(compressor);
    compressor.connect(dcOutGain);
    dcOutGain.connect(reverb);
    reverb.connect(rvOutGain);
    rvOutGain.connect(masterGain);
    masterGain.connect();  

    apply_fx(); //apply current settings from draw loop
    
    fftOutput.setInput(masterGain); //analyze final output
}

  function sounds_configuration(){
    // Initialize sound file list from assets folder
    // List of dummy files found in the assets folder
    soundFiles = [
        'Call_security.wav',
        'Counting.wav',
        'Somebody.wav',
    ];

    //create buttons with positions
    
    // Create label using paragraph element
    text('Prerecorded Sounds:', 250, 560 - 30);
    text('Your Recorded Sounds:', 250 + 200, 560 - 30);

    // Create button for each sound file
    for (var i = 0; i < soundFiles.length; i++) {
        var btn = createButton(soundFiles[i]);
        btn.position(250, 560 + 30*i);
        btn.mousePressed(function(index) {
            return function() {
                selectSound(index);
            };
        }(i));
    }
    
    // Create button for recorded sound option
    
    // Create record control button (separate from playback record button)
    recordButton = createButton('Start Recording');
    recordButton.position(250-180, 560);
    recordButton.mousePressed(start_recording);
    stopRecordButton = createButton('Stop Recording');
    stopRecordButton.position(250-180, 560 +40);
    stopRecordButton.mousePressed(stop_recording);
    playProcessedSound = createButton('play processed sound');
    playProcessedSound.position(250-180, 560 +80);
    playProcessedSound.mousePressed(play_processed_sound);
    stopProcessedSound = createButton('stop processed sound');
    stopProcessedSound.position(250-180, 560 +120);
    stopProcessedSound.mousePressed(stopSound);
    saveToFileButton = createButton('Save to file');
    saveToFileButton.position(250-180, 560 +160);
    saveToFileButton.mousePressed(save_recording);
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
    //Disconnect from existing chains
    player.disconnect();
    lowPass.disconnect();
    distortion.disconnect();
    compressor.disconnect();
    reverb.disconnect();
    masterGain.disconnect();

    player.connect();
    player.setVolume(mv_volumeSlider.value());
    fftInput.setInput(player);

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
}

function stopSound(){
    if(!player) return;
    player.stop();
    pausePlayButton.html('play');
}

function selectSound(index){
    selectedSoundIndex = index; 
    reload_player(soundFiles[index])
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

    isRecording = true;
}

function stop_recording(){
    if (!isRecording) return; //if no record exists, do nothing
    recorder.stop();
    recordedSounds.push(recordedSoundFile);
    recordedSoundMetadata.push(get_slider_settings()); 
    console.log('Recording stopped');
    update_recorded_sounds();
    isRecording=false;
}

function selectRecordedSound(index){
    if (recordedSounds.length <1) return; //if no record exists, do nothing

    if(player) player.stop();
    player = recordedSounds[index]; //update player to the p5 sound object

    apply_slider_settings(recordedSoundMetadata[index]); //restore UI to state at the time of recording. TODO adust to time of saving? 

    var nowPlayingString = "recorded sound " + (index + 1)
    nowPlaying.html(nowPlayingString);
}

function save_recording(){
    if(!player) return;

    //initialize chain for the current settings
    process_audio();

    processedFileToSave = new p5.SoundFile();

    processedRecorder.setInput(masterGain); 

    const durationToSave = player.duration();

    player.stop();
    player.play();

    //record and save using the recorder logic from above. includes call back to download locally as wav file. 

    processedRecorder.record(processedFileToSave, durationToSave, () =>{
        const filename = "processed_"+Date.now() + ".wav"; 
        saveSound(processedFileToSave, filename); //download from browser
    });

}

function update_recorded_sounds(){

    for (var i = 0; i < recordedSounds.length; i++) {
        var btnName = "Recording " + (i+1);
        var btn = createButton(btnName);
        btn.position(450, 560 + 30*i);
        btn.mousePressed(function(index) {
            return function() {
                selectRecordedSound(index);
            };
        }(i));
    }
}

function play_processed_sound(){
    if(!player) return;
    process_audio();

    if(player.isPlaying()) player.stop();
    
    if(loopButton.value()=="Loop"){
        player.loop();
    } else player.play();

}

function apply_fx(){
    masterGain.amp(mv_volumeSlider.value());

    lowPass.freq(lp_cutOffSlider.value());
    lowPass.res(lp_resonanceSlider.value());

    var oversampleStr;
    if(wd_oversampleSlider.value()==2){
        oversampleStr = '2x'

    }else if(wd_oversampleSlider.value()==4){
        oversampleStr = '4x'
    }else{
        oversampleStr ="none"
    }

    //apply distortion, reverb, compressor settings... base the wd mix on this. 
    distortion.set(wd_amountSlider.value() * wd_dryWetSlider.value(),oversampleStr);
    reverb.set(rv_durationSlider.value() * rv_dryWetSlider.value(), rv_decaySlider.value(),rv_isReversed);
    compressor.set(dc_attackSlider.value(), dc_kneeSlider.value(), dc_ratioSlider.value(), dc_thresholdSlider.value(), dc_releaseSlider.value());

    //set each module gain based on slider values
    lpOutGain.amp(lp_outputSlider.value());
    wdOutGain.amp(wd_outputSlider.value());
    dcOutGain.amp(dc_outputSlider.value());
    rvOutGain.amp(rv_outputSlider.value());
}

function get_slider_settings(){
    return {
        lp: { cutoff: lp_cutOffSlider.value(), resonance: lp_resonanceSlider.value(), dryWet: lp_dryWetSlider.value(), output: lp_outputSlider.value() },
        dc: { attack: dc_attackSlider.value(), knee: dc_kneeSlider.value(), release: dc_releaseSlider.value(), ratio: dc_ratioSlider.value(), threshold: dc_thresholdSlider.value(), dryWet: dc_dryWetSlider.value(), output: dc_outputSlider.value() },
        mv: { volume: mv_volumeSlider.value() },
        rv: { duration: rv_durationSlider.value(), decay: rv_decaySlider.value(), dryWet: rv_dryWetSlider.value(), output: rv_outputSlider.value(), reverse: false },
        wd: { amount: wd_amountSlider.value(), oversample: wd_oversampleSlider.value(), dryWet: wd_dryWetSlider.value(), output: wd_outputSlider.value() },
    };
}

function apply_slider_settings(selected) {

    lp_cutOffSlider.value(selected.lp.cutoff);
    lp_resonanceSlider.value(selected.lp.resonance);
    lp_dryWetSlider.value(selected.lp.dryWet);
    lp_outputSlider.value(selected.lp.output);
    dc_attackSlider.value(selected.dc.attack);
    dc_kneeSlider.value(selected.dc.knee);
    dc_releaseSlider.value(selected.dc.release);
    dc_ratioSlider.value(selected.dc.ratio);
    dc_thresholdSlider.value(selected.dc.threshold);
    dc_dryWetSlider.value(selected.dc.dryWet);
    dc_outputSlider.value(selected.dc.output);
    mv_volumeSlider.value(selected.mv.volume);
    rv_durationSlider.value(selected.rv.duration);
    rv_decaySlider.value(selected.rv.decay);
    rv_dryWetSlider.value(selected.rv.dryWet);
    rv_outputSlider.value(selected.rv.output);
    wd_amountSlider.value(selected.wd.amount);
    wd_oversampleSlider.value(selected.wd.oversample);
    wd_dryWetSlider.value(selected.wd.dryWet);
    wd_outputSlider.value(selected.wd.output);
  
    apply_fx();
  }