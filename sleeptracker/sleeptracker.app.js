// sleeptracker/sleeptracker.app.js
// BLE GATT service & characteristic UUIDs
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHAR_UUID    = '87654321-4321-4321-4321-ba0987654321';

// Advertise our custom BLE service & characteristic
NRF.setServices({
  [SERVICE_UUID]: {
    [CHAR_UUID]: { readable: true, notify: true, value: [] }
  }
}, { advertise: [SERVICE_UUID], uart: false });

// Log when a central connects/disconnects
NRF.on('connect', () => console.log('BLE central connected'));
NRF.on('disconnect', () => console.log('BLE central disconnected'));

// Load & draw widgets
Bangle.loadWidgets();
Bangle.drawWidgets();

// Data buffers and state
let hrData = [];
let motionData = [];
let sleepData = []; // Stores sleep phases with timestamps
let hrWindow = [];
let motionWindow = [];
let smoothedHR = "--";
let smoothedMotion = "--";
let sleepPhase = "Awake";
let lastPhase = "Awake";
const WINDOW_SIZE = 10;
const SCORES = {
  awake: { hr: 3, motion: 3 },
  light: { hr: 1, motion: 2 },
  rem:   { hr: 2, motion: 1 },
  deep:  { hr: 1, motion: 0 },
};
let hrThreshold = 10;
let motionThreshold = 0.2;
let reportMode = false;

// Helper: Calculate average of an array
function calculateAverage(data) {
  return data.length>0 ? data.reduce((a,b)=>a+b,0)/data.length : 0;
}

// Helper: Low-pass filter for smoothing
function lowPassFilter(current, previous, alpha) {
  alpha = alpha || 0.1;
  return alpha*current + (1-alpha)*previous;
}

// Helper: Sliding window processing
function updateWindow(window, value, size) {
  window.push(value);
  if(window.length>size) window.shift();
  return calculateAverage(window);
}

// Update thresholds every minute
function optimizeThresholds() {
  if(hrData.length>0) {
    hrThreshold = calculateAverage(hrData)*1.2;
  }
  if(motionData.length>0) {
    motionThreshold = calculateAverage(motionData)*1.2;
  }
  hrData = [];
  motionData = [];
}

// Classify sleep phase based on HR and motion
function classifySleep(hr, motion) {
  const score = {
    awake: SCORES.awake.hr*(hr>hrThreshold) + SCORES.awake.motion*(motion>motionThreshold),
    light: SCORES.light.hr*(hr>hrThreshold) + SCORES.light.motion*(motion<=motionThreshold),
    rem:   SCORES.rem.hr*(hr<=hrThreshold)  + SCORES.rem.motion*(motion<=motionThreshold),
    deep:  SCORES.deep.hr*(hr<=hrThreshold/2)+ SCORES.deep.motion*(motion<motionThreshold/2),
  };
  let phase = Object.keys(score).reduce((a,b)=>score[a]>score[b]?a:b);
  if(phase==='rem' && lastPhase!=='light') phase='light';
  lastPhase = phase;
  return phase;
}

// Send the sleepData over BLE when invoked
function sendSleepDataOverBLE() {
  const dateKey = new Date().toISOString().slice(0,10);
  const payload = { date: dateKey, entries: sleepData };
  const str = JSON.stringify(payload);
  const data = E.toUint8Array(str);
  NRF.updateServices({
    [SERVICE_UUID]: { [CHAR_UUID]: { value: data } }
  });
  console.log('✅ Sleep data advertised via BLE');
}

// Save sleep data locally and push via BLE
function saveSleepData() {
  const dateKey = new Date().toISOString().slice(0,10);
  const stored = require('Storage').readJSON('sleepdata.json',1) || {};
  stored[dateKey] = sleepData;
  require('Storage').write('sleepdata.json', stored);
  console.log('Sleep data saved.');
  sendSleepDataOverBLE();
}

// Display real-time sleep tracking
function displayData() {
  g.clear();
  g.setFont('6x8',2);
  g.setFontAlign(0,0);
  g.drawString('Sleep Tracker', g.getWidth()/2,20);
  g.setFont('6x8',1);
  g.drawString(`HR: ${smoothedHR}`, g.getWidth()/2,50);
  g.drawString(`Motion: ${Math.round(smoothedMotion*100)/100}`, g.getWidth()/2,70);
  g.drawString(`Phase: ${sleepPhase}`, g.getWidth()/2,90);
  g.drawString('BTN1: Exit', g.getWidth()/2, g.getHeight()-20);
  g.flip();
}

// Display sleep report with percentages & tips
function displayReport() {
  g.clear();
  g.setFont('6x8',2);
  g.setFontAlign(0,0);
  g.drawString('Sleep Report', g.getWidth()/2,20);

  const counts = { awake:0, light:0, rem:0, deep:0 };
  sleepData.forEach(e=>counts[e.phase]++);
  const total = sleepData.length;
  const p = phase=>Math.round((counts[phase]/total)*100);
  g.drawString(`Awake: ${p('awake')}%`, g.getWidth()/2,50);
  g.drawString(`Light: ${p('light')}%`, g.getWidth()/2,70);
  g.drawString(`REM: ${p('rem')}%`, g.getWidth()/2,90);
  g.drawString(`Deep: ${p('deep')}%`, g.getWidth()/2,110);

  let tip='Tip: Maintain a consistent sleep schedule!';
  if(p('awake')>30) tip='Tip: Reduce stress before bedtime.';
  else if(p('deep')<20)  tip='Tip: Create a darker sleeping environment.';
  g.setFont('6x8',1);
  g.drawString(tip, g.getWidth()/2, g.getHeight()-30);
  g.flip();
}

// Start heart-rate monitoring
function startHRM() {
  Bangle.setHRMPower(1,'sleep');
  let lastHR=0;
  Bangle.on('HRM',hrm=>{
    if(hrm.confidence>80) {
      const f=lowPassFilter(hrm.bpm,lastHR);
      lastHR=f;
      smoothedHR=updateWindow(hrWindow,f,WINDOW_SIZE);
      hrData.push(f);
    }
  });
}

// Start accelerometer monitoring
function startAccelerometer() {
  let prev=0;
  Bangle.on('accel',a=>{
    let m=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z)-1;
    m=lowPassFilter(m,prev);
    prev=m;
    smoothedMotion=updateWindow(motionWindow,m,WINDOW_SIZE);
    motionData.push(m);
  });
}

// Classify & record sleep every second
function startClassification() {
  setInterval(()=>{
    sleepPhase=classifySleep(smoothedHR,smoothedMotion);
    sleepData.push({ time:Date.now(), phase:sleepPhase });
    if(!reportMode) displayData();
  },1000);
}

// Adjust thresholds every minute
function startThresholdOptimization() {
  setInterval(optimizeThresholds,60000);
}

// Stop sensors & listeners
function stopSensors() {
  Bangle.setHRMPower(0,'sleep');
  Bangle.removeAllListeners('HRM');
  Bangle.removeAllListeners('accel');
}

// Toggle between live view & report
function toggleReport() {
  reportMode=!reportMode;
  if(reportMode) displayReport(); else displayData();
}

// Exit: stop & save
function exitApp() {
  stopSensors();
  saveSleepData();
  load();
}

// Button bindings
setWatch(exitApp, BTN1, { repeat:false });
setWatch(toggleReport, BTN2, { repeat:true });

// Launch sequence
g.clear();
 g.setFont('6x8',2);
g.setFontAlign(0,0);
 g.drawString('Starting Sleep Tracker',g.getWidth()/2,g.getHeight()/2);
 g.flip();
startHRM();
startAccelerometer();
startClassification();
startThresholdOptimization();
