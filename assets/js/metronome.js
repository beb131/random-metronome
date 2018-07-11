var audioContext = null;
var timerWorker = null;       // The Web Worker used to fire timer messages
var isPlaying = false;
var startTime;                // The start time of the entire sequence.
var currentTwelveletNote;     // What note is currently last scheduled?
var lookahead = 25.0;         // How frequently to call scheduling function
                              // (in milliseconds)
var scheduleAheadTime = 0.1;  // How far ahead to schedule audio (sec)
                              // This is calculated from lookahead, and overlaps
                              // with next interval (in case the timer is late)
var nextNoteTime = 0.0;       // when the next note is due.
var noteLength = 0.05;        // length of "beep" (in seconds)
var notesInQueue = [];        // the notes that have been put into the web audio,
                              // and may or may not have played yet. {note, time}
var tempo = 120.0;
var meter = 4;
var key = 440;                // "A" Note
var active = false;
var masterVolume = 0.5;
var accentVolume = 0.75;
var quarterVolume = 0.5;
var eighthVolume = 0.5;
var sixteenthVolume = 0.5;
var tripletVolume = 0.5;
var isRandomized = false;
var randOutput = document.getElementById("rand_output");

//Used to check if element has class "playing" and is therefore active
var quarterNote = document.querySelector("#quarter button");
var eighthNote = document.querySelector("#eighth button");
var sixteenthNote = document.querySelector("#sixteenth button");
var tripletNote = document.querySelector("#triplet button");


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
  } else if (beatNumber % 12 === 0 && quarterNote.classList.contains("playing")) {
    osc.frequency.value = key;
    gainNode.gain.value = calcVolume(quarterVolume);
  } else if (beatNumber % 6 === 0 && eighthNote.classList.contains("playing")) {
    osc.frequency.value = key;
    gainNode.gain.value = calcVolume(eighthVolume);
  } else if (beatNumber % 4 === 0 && tripletNote.classList.contains("playing")) {
    
    osc.frequency.value = key * 1.75;
    gainNode.gain.value = calcVolume(tripletVolume);
  } else if (beatNumber % 3 === 0 && sixteenthNote.classList.contains("playing")) {
    osc.frequency.value = key;
    gainNode.gain.value = calcVolume(sixteenthVolume);
  } else {
    gainNode.gain.value = 0;                             // keep the remaining twelvelet notes inaudible
  }

  osc.start(time);
  osc.stop(time + noteLength);
}

function toggleIsActive(value) {
  var activeButton = document.querySelector("#" + value + " button");

  if (activeButton.classList.contains("playing")) {
    activeButton.textContent = "Activate";
    activeButton.classList.remove("playing");
  } else {
    activeButton.textContent = "Deactivate";
    activeButton.classList.add("playing");    
  }
}

function randomizer() {
  var randomizerButton = document.getElementById("rand_button");
  var activeButtons = document.querySelectorAll(".button-container button");
  var randNum = Math.floor(Math.random() * 20) + 1;
  var randValues = [];
  var randReturn;

  if (!isRandomized){

    if (randNum <= 5) {
      //randValues.push("quarter");
      randReturn = "Quarter";
    } else if (randNum <= 10) {
      randValues.push("eighth");
      randReturn = "Eighth";
    } else if (randNum <= 15) {
      randValues.push("sixteenth");
      randReturn = "Sixteenth";
    } else {
      randValues.push("triplet");
      randReturn = "Triplet";
    }

    randomizerButton.innerHTML = "Unrandomize!";
    isRandomized = true;
    randValues.forEach(function(value) {
      toggleIsActive(value);
    });

  } else { //isRandomized
    randReturn = "Randomizer Stopped";
    randomizerButton.innerHTML = "Randomize!";
    isRandomized = false;
    for (var i = 1; i < activeButtons.length; i++) {
      activeButtons[i].classList.remove("playing");
      activeButtons[i].innerHTML = "Activate";
    }
  }

  randOutput.innerHTML = randReturn;
  return randReturn;
}

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