var audioContext = null;
var isPlaying = false;
var startTime;                // The start time of the entire sequence.
var currentTwelveletNote;     // What note is currently last scheduled?
var tempo = 120.0;
var meter = 4;
var key = 440;
var masterVolume = 0.5;
var accentVolume = 1;
var quarterVolume = 0.75;
var eighthVolume = 0;
var sixteenthVolume = 0;
var tripletVolume = 0;
var lookahead = 25.0;         // How frequently to call scheduling function
                              // (in milliseconds)
var scheduleAheadTime = 0.1;  // How far ahead to schedule audio (sec)
                              // This is calculated from lookahead, and overlaps
                              // with next interval (in case the timer is late)
var nextNoteTime = 0.0;       // when the next note is due.
var noteLength = 0.05;        // length of "beep" (in seconds)
var notesInQueue = [];        // the notes that have been put into the web audio,
                              // and may or may not have played yet. {note, time}
var timerWorker = null;       // The Web Worker used to fire timer messages
var randomized = false;

function setKey(keyInput) {
  key = keyInput;
  document.getElementById("hzOutput").innerHTML = key;

  switch(key) {
    case '261.626':
      keyOutput = 'C';
      break;
    case '277.183':
      keyOutput = 'C#';
      break;
    case '293.665':
      keyOutput = 'D';
      break;
    case '311.127': 
      keyOutput = 'D#';
      break;
    case '329.628': 
      keyOutput = 'E';
      break;
    case '349.228': 
      keyOutput = 'F';
      break;
    case '369.994': 
      keyOutput = 'F#';
      break;
    case '391.995': 
      keyOutput = 'G';
      break;
    case '415.305': 
      keyOutput = 'G#';
      break;
    case '440.000': 
      keyOutput = 'A';
      break;
    case '466.164': 
      keyOutput = 'A#';
      break;
    case '493.883': 
      keyOutput = 'B';
      break;
    case '523.251': 
      keyOutput = 'C';
      break;
    default: 
      keyOutput = 'A';
      break;
  }

  document.getElementById("keyOutput").innerHTML = keyOutput;

  return key;
}

function maxBeats() {
  var beats = (meter * 12);
  return beats;
}

function nextTwelvelet() {
  var secondsPerBeat = 60.0 / tempo;
  nextNoteTime += 0.08333 * secondsPerBeat;    // Add beat length to last beat time
  currentTwelveletNote++;    // Advance the beat number, wrap to zero

  if (currentTwelveletNote == maxBeats()) {
    currentTwelveletNote = 0;
  }
}

function calcVolume(beatVolume) {
  return (beatVolume * masterVolume);
}

function scheduleNote(beatNumber, time) {
  // push the note on the queue, even if we're not playing.
  notesInQueue.push({ note: beatNumber, time: time });

  var osc = audioContext.createOscillator();
  var gainNode = audioContext.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (beatNumber % maxBeats() === 0) {
    if (accentVolume > 0.25) {
      osc.frequency.value = key * 2;
      gainNode.gain.value = calcVolume(accentVolume);
    } else {
      osc.frequency.value = key;
      gainNode.gain.value = calcVolume(quarterVolume);
    }
  } else if (beatNumber % 12 === 0) {                     // quarter notes = medium pitch
    osc.frequency.value = key;
    gainNode.gain.value = calcVolume(quarterVolume);
  } else if (beatNumber % 6 === 0) {
    osc.frequency.value = key;
    gainNode.gain.value = calcVolume(eighthVolume);
  } else if (beatNumber % 4 === 0) {
    osc.frequency.value = key * 1.75;
    gainNode.gain.value = calcVolume(tripletVolume);
  } else if (beatNumber % 3 === 0 ) {                    // other 16th notes = low pitch
    osc.frequency.value = key;
    gainNode.gain.value = calcVolume(sixteenthVolume);
  } else {
    gainNode.gain.value = 0;                             // keep the remaining twelvelet notes inaudible
  }

  osc.start(time);
  osc.stop(time + noteLength);
}

function randomizer() {
  if (randomized){
    document.getElementById("rand_button").innerHTML = "Randomize!";
    randomized = false;
  } else {
    document.getElementById("rand_button").innerHTML = "Unrandomize!";
    randomized = true;
    //eighthVolume = 100;
    //console.log(eighthVolume);
  }
}

function scheduler() {
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
    scheduleNote( currentTwelveletNote, nextNoteTime );
    nextTwelvelet();
  }
}

function play() {
  isPlaying = !isPlaying;

  if (isPlaying) {
    currentTwelveletNote = 0;
    nextNoteTime = audioContext.currentTime;
    timerWorker.postMessage("start");
    document.getElementById("play-icon").innerHTML = "pause";
  } else {
    timerWorker.postMessage("stop");
    document.getElementById("play-icon").innerHTML = "play_arrow";
  }
}

function init(){
  audioContext = new AudioContext();
  //Chrome did me dirty, this replaced the following ------> `timerWorker = new Worker("./assets/js/worker.js");`
  timerWorker = new Worker(URL.createObjectURL(new Blob(["("+worker_function.toString()+")()"], {type: 'text/javascript'})));
  
  timerWorker.onmessage = function(e) {
    if (e.data == "tick") {
      scheduler();
    } else {
      console.log("message: " + e.data);
    }
  };

  timerWorker.postMessage({"interval":lookahead});
}

window.addEventListener("load", init );