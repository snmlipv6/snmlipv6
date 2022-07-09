"use strict";

var logText = document.getElementById("idSnmlLogText");
function snmlWebLog(msg) {
  
}
snmlWebLog("screen.width:" + screen.width);
snmlWebLog("screen.height:" + screen.height);
snmlWebLog("screen.availWidth:" + screen.availWidth);
snmlWebLog("screen.availHeight:" + screen.availHeight);
snmlWebLog("screen.colorDepth:" + screen.colorDepth);
snmlWebLog("screen.pixelDepth:" + screen.pixelDepth);

//WebRtc,https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API/Signaling_and_video_calling
//https://www.w3cschool.cn/javascript_guide/javascript_guide-l4zu26al.html
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API#audio_workers

var constraints = { audio: true };
const soundDevices = document.querySelector('.sound-devices');
const inputDevice = document.getElementById("idSnmlInputDevice");
var selectDevice = false;
var allMediaSource = [];
let audioCtx = new AudioContext();;

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    snmlWebLog("不支持 enumerateDevices() .");
}
else {

    // 列出相机和麦克风。
    navigator.mediaDevices.enumerateDevices()
        .then(function (devices) {
            devices.forEach(function (device) {
                snmlWebLog(device.kind + ": " + device.label + ",id=" + device.deviceId);
                var newOption = new Option(device.label, device.deviceId, false);
                inputDevice.options.add(newOption);

                var newMediaSource = { Name: device.label, Deviceid: device.deviceId };
                allMediaSource.push(newMediaSource);
            });

        })
        .catch(function (err) {
            snmlWebLog(err.name + ": " + err.message);
        });


}

inputDevice.onchange = function (e) {
    snmlWebLog("inputDevice.onchange: " + e);
    for (var i = 0; i < inputDevice.length; i++) {
        if (inputDevice.options[i].selected) {
            snmlWebLog("inputDevice.onchange,index: " + i + ",value:" + inputDevice.options[i].value);
            boolPause = false;
            if (boolPause) butPause.textContent = 'Start';
            else butPause.textContent = 'Pause';
            selectDevice = true;
            //displayDevice( inputDevice.options[i].value );
            displayDevice(allMediaSource[i].Deviceid);
            break;
        }

    }
}

// set up basic variables for app
var inputBili = document.getElementById("idSnmlInputBili");
var inputColor = document.getElementById("idSnmlInputColor");
var inputSliceWidth = document.getElementById("idSnmlInputSliceWidth");
var inputScreenFreq = document.getElementById("idSnmlInputScreenFreq");
var inputFreqBegin = document.getElementById("idSnmlInputFreqBegin");
var inputFreqEnd = document.getElementById("idSnmlInputFreqEnd");

var butSnapshot = document.getElementById("idSnmlButSnapshot");
var butPause = document.getElementById("idSnmlButPause");
var boolPause = true;
var boolPlaying = false;

const imgSnapshot = document.getElementById("idSnmlSnapshot");
const audioRecorder = document.getElementById("idSnmlAudioRecorder");
const audioRate = document.getElementById("idSnmlAudioPlaybackRate");
const audioRateLabel = document.getElementById("idSnmlAudioPlaybackRateLabel");

butPause.onclick = function () {
    boolPause = !boolPause;
    if (boolPause) butPause.textContent = 'Start';
    else {
        if (!selectDevice) displayDevice("default");
        butPause.textContent = 'Pause';
    }
}


audioRate.onchange = function (e) {
    audioRecorder.playbackRate = audioRate.value;
    audioRecorder.defaultPlaybackRate = audioRate.value;
    audioRateLabel.innerHTML = "PlaybackRate:" + audioRate.value;

}



audioRecorder.onplay = function (e) {
    let audioMediaStream = audioRecorder.captureStream();
    //audioSourceNode = audioContext.createMediaStreamSource(audioMediaStream);

    boolPlaying = true;
    //boolPause = false;
    //if(boolPause) butPause.textContent = 'Start';
    switchMediaSource(audioMediaStream);
}

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const snmlCanvasMain = document.getElementById("idSnmlDataVisualizer");

const mainSection = document.querySelector('.main-controls');
// disable stop button while not recording
stop.disabled = true;

// visualiser setup - create web audio api context and canvas
const snmlCanvasMainCtx = snmlCanvasMain.getContext("2d");

butSnapshot.onclick = function () {
    imgSnapshot.src = snmlCanvasMain.toDataURL();
}

var lastMediaSource = null;
const analyser = audioCtx.createAnalyser();

//analyser.fftSize = 2048;
//analyser.fftSize = 8192;
analyser.fftSize = 32768;
const bufferLengthFreq = analyser.frequencyBinCount;
const bufferLength = analyser.fftSize;
//const dataArray = new Uint8Array(bufferLength);
var dataArray = new Float32Array(bufferLength);
//const dataArrayFreq = new Uint8Array(bufferLengthFreq);
const dataArrayFreq = new Float32Array(bufferLengthFreq);

//main block for doing the audio recording
function displayDevice(deviceId) {
    boolPause = true;
    if (navigator.mediaDevices.getUserMedia) {
        snmlWebLog("getUserMedia supported,deviceId =" + deviceId);

        if (selectDevice) constraints = { audio: { deviceId: deviceId, sampleRate: 96000 } };
        let chunks = [];
        let onSuccess = function (stream) {
            //const tracks = stream.getAudioTracks();
            //tracks[0].stop();
            //snmlWebLog(tracks + tracks.length  );
            const mediaRecorder = new MediaRecorder(stream);

            record.onclick = function () {
                mediaRecorder.start();
                snmlWebLog(mediaRecorder.state);
                snmlWebLog("recorder started");
                record.style.background = "red";

                stop.disabled = false;
                record.disabled = true;
            }

            stop.onclick = function () {
                mediaRecorder.stop();
                snmlWebLog(mediaRecorder.state);
                snmlWebLog("recorder stopped");
                record.style.background = "";
                record.style.color = "";
                // mediaRecorder.requestData();

                stop.disabled = true;
                record.disabled = false;
            }

            mediaRecorder.onstop = function (e) {
                snmlWebLog("data available after MediaRecorder.stop() called.");

                audioRecorder.controls = true;

                const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                chunks = [];
                const audioURL = window.URL.createObjectURL(blob);
                audioRecorder.src = audioURL;
                audioRecorder.volume = 1;

                snmlWebLog("audioRecorder->stopped");
            }

            mediaRecorder.ondataavailable = function (e) {
                chunks.push(e.data);
            }

            switchMediaSource(stream);

        }

        let onError = function (err) {
            snmlWebLogText('The following error occured: ' + err);
        }

        navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

    }
    else {
        snmlWebLog('getUserMedia not supported on your browser!');
    }
}

function switchMediaSource(stream) {
    boolPause = true;

    var mySampleRate = audioCtx.sampleRate;
    snmlWebLog("audioCtx.sampleRate:" + mySampleRate);
    if (lastMediaSource) lastMediaSource.disconnect();

    const source = audioCtx.createMediaStreamSource(stream);
    lastMediaSource = source;

    // 创建声道分离处理器
    //var splitterNode = audioCtx.createChannelSplitter(2);
    // 源处理器连接声道分离处理器
    //source.connect(splitterNode)
    //source.disconnect();

    source.connect(analyser);
    //splitterNode.connect(analyser,0,0);
    //splitterNode.connect(analyser,1,1);
    //analyser.connect(audioCtx.destination);
    snmlWebLog("source.channelCount:" + source.channelCount);

    snmlWebLog("analyser.numberOfInputs:" + analyser.numberOfInputs);
    snmlWebLog("analyser.numberOfOutputs:" + analyser.numberOfOutputs);
    snmlWebLog("analyser.channelCount:" + analyser.channelCount);
    snmlWebLog("analyser.channelCountMode:" + analyser.channelCountMode);
    snmlWebLog("analyser.channelInterpretation:" + analyser.channelInterpretation);

    analyser.channelInterpretation = 'discrete';
    snmlWebLog("analyser.channelInterpretation:" + analyser.channelInterpretation);

    analyser.channelCountMode = 'explicit';
    snmlWebLog("analyser.channelCountMode:" + analyser.channelCountMode);

    boolPause = false;
}

let ilCount = 0;
let ilAvgCount = 0;
var ilVmax = 0.00;
var ilVmin = 0.00;
var vBili2 = 0.0;
var dStart = new Date();
var startMilliseconds = dStart.getTime();
var lastCallTime = startMilliseconds;

drawAnimationFrame();

function drawAnimationFrame() {
    requestAnimationFrame(drawAnimationFrame);
    if (boolPause) return;

    const WIDTH = snmlCanvasMain.width
    const HEIGHT = snmlCanvasMain.height / 2;

    var dNow = new Date();
    var nowMilliseconds = dNow.getTime();
    if ((nowMilliseconds - lastCallTime) < (1000 / inputScreenFreq.value)) return;
    lastCallTime = nowMilliseconds;

    analyser.getFloatTimeDomainData(dataArray);

    snmlCanvasMainCtx.fillStyle = 'rgb(200, 200, 200)';
    snmlCanvasMainCtx.fillRect(0, 0, snmlCanvasMain.width, snmlCanvasMain.height);//TimeData and FreqData

    snmlCanvasMainCtx.lineWidth = 1;
    snmlCanvasMainCtx.strokeStyle = inputColor.value;
    snmlCanvasMainCtx.beginPath();

    var vMax = 0.0;
    var vMin = 0.0;
    var vAvg = 0.0;
    var vAvgMin = 0.0;
    var vMaxPos = 0;
    var vMinPos = 0;
    for (let i = 0; i < bufferLength; i++) {
        if (vMax < dataArray[i]) { vMax = dataArray[i]; vMaxPos = i; }
        if (vMin > dataArray[i]) { vMin = dataArray[i]; vMinPos = i; }
    }

    var vStartPoint = 0;

    /*********
    for(let i = 0; i < maxWidth/sliceWidth; i++)
    {
        if( dataArray[i] / vMax < 0.1 )
        {
        vStartPoint = i;
        break;
        }
    }
    *****/

    var vBili = Number(inputBili.value) * 1000;
    let x = 0;
    let maxWidth = WIDTH;

    let sliceWidth = Number(inputSliceWidth.value);

    for (let i = 0; i < (bufferLength - vStartPoint); i++) {

        var v = dataArray[i + vStartPoint] * vBili;
        var y = HEIGHT / 2 - v;

        if (i === 0) {
            snmlCanvasMainCtx.moveTo(x, y);
        } else {
            snmlCanvasMainCtx.lineTo(x, y);
        }

        x += sliceWidth;
        if (x > maxWidth) break;
    }

    snmlCanvasMainCtx.moveTo(0, HEIGHT / 2);
    snmlCanvasMainCtx.lineTo(maxWidth, HEIGHT / 2);

    snmlCanvasMainCtx.moveTo(maxWidth / 2, 0);
    snmlCanvasMainCtx.lineTo(maxWidth / 2, HEIGHT);


    var yMax = HEIGHT / 2 - dataArray[vMaxPos] * vBili;
    snmlCanvasMainCtx.moveTo(maxWidth / 2, yMax);
    snmlCanvasMainCtx.lineTo(maxWidth / 2 + 10, yMax);

    var yMin = HEIGHT / 2 - dataArray[vMinPos] * vBili;
    snmlCanvasMainCtx.moveTo(maxWidth / 2, yMin);
    snmlCanvasMainCtx.lineTo(maxWidth / 2 + 10, yMin);

    snmlCanvasMainCtx.stroke();

    snmlCanvasMainCtx.fillStyle = inputColor.value;
    snmlCanvasMainCtx.strokeStyle = inputColor.value;

    snmlCanvasMainCtx.font = '12px Arial';
    ilCount++;
    ilAvgCount++;

    if (ilAvgCount > 30) {
        ilVmax = vMax;
        ilVmin = vMin;
        ilAvgCount = 0;
    }


    var vMax2 = Math.round(ilVmax * 1000000) / 1000;
    var vMin2 = Math.round(ilVmin * 1000000) / 1000;

    snmlCanvasMainCtx.fillText("sampleRate:" + audioCtx.sampleRate + ", Width:" + maxWidth + "px, " + Math.round(maxWidth * 1000 / audioCtx.sampleRate) + "ms, Vmax:" + vMax2 + "mV, Vmin:" + vMin2 + "mV, Scale:" + vBili, 10, 20);
    snmlCanvasMainCtx.fillText("Vmax:" + vMax2 + "mV", maxWidth / 2 + 20, yMax);
    snmlCanvasMainCtx.fillText("Vmin:" + vMin2 + "mV", maxWidth / 2 + 20, yMin);

    snmlCanvasMainCtx.fillText("dateTime:" + dNow.toISOString(), maxWidth / 2 + 20, 20);
    drawFrequency();

}

function drawFrequency() {
    const freqWIDTH = snmlCanvasMain.width;
    const freqHEIGHT = snmlCanvasMain.height / 2;
    //analyser.getByteFrequencyData(dataArrayFreq);
    //获取实时的频谱信息,数组中的每一项都代表特定频率的分贝值。频率从采样率的 0 到 1/2 线性扩展。例如，对于48000Hz 采样率，数组的最后一项将表示24000Hz 的分贝值。
    analyser.getFloatFrequencyData(dataArrayFreq);

    snmlCanvasMainCtx.fillStyle = 'rgb(200, 200, 200)';
    //snmlCanvasMainCtx.fillRect(0, 0, freqWIDTH, freqHEIGHT);
    snmlCanvasMainCtx.fillStyle = inputColor.value; //'rgb(' + (barHeight+100) + ',50,50)';

    //snmlCanvasMainCtx.fillText("sampleRate:48000hz", 10, 40);
    //spread linearly from 0 to 1/2 of the sample rate. For example, for 48000 sample rate, the last item of the array will represent the decibel value for 24000 Hz.
    var dataFreqStep = 1.00 * audioCtx.sampleRate / freqWIDTH / 2;

    snmlCanvasMainCtx.beginPath();

    snmlCanvasMainCtx.font = '12px Arial';
    snmlCanvasMainCtx.lineWidth = 1;
    snmlCanvasMainCtx.fillStyle = inputColor.value;
    snmlCanvasMainCtx.strokeStyle = inputColor.value;

    var startFreq = audioCtx.sampleRate / 2 * inputFreqBegin.value / 24;
    var endFreq = audioCtx.sampleRate / 2 * inputFreqEnd.value / 24;
    if (startFreq >= endFreq) endFreq = startFreq + 1000;

    var freqStepPx = 1.00 * freqWIDTH / (endFreq - startFreq);
    for (var hz = startFreq; hz < endFreq; hz += 1000) {
        var x1 = (hz - startFreq) * freqStepPx;
        if (hz < 1000) snmlCanvasMainCtx.fillText(hz, Math.max(x1, 2), snmlCanvasMain.height);
        else snmlCanvasMainCtx.fillText(Math.round(hz / 1000) + "K", Math.max(x1 - 10, 2), snmlCanvasMain.height);
        snmlCanvasMainCtx.moveTo(x1, snmlCanvasMain.height - 15);
        snmlCanvasMainCtx.lineTo(x1, snmlCanvasMain.height - 20);

    }
    snmlCanvasMainCtx.moveTo(0, snmlCanvasMain.height - 20);
    snmlCanvasMainCtx.lineTo(freqWIDTH, snmlCanvasMain.height - 20);

    var yMax2 = -1000;
    var yMin2 = 1000;
    var iMax2 = 0;
    var iMin2 = 0;
    var xStep = 1.00 * freqWIDTH / bufferLengthFreq;
    var lastX2 = 0;
    var stepMaxDb = -200.00;

    xStep = 1.00 * freqWIDTH / (endFreq - startFreq);
    var freqPerData = 1.00 * audioCtx.sampleRate / 2 / (bufferLengthFreq - 1);

    /*****/
    for (var i = Math.round(startFreq / freqPerData); i < Math.round(endFreq / freqPerData); i++) {

        if (stepMaxDb < dataArrayFreq[i]) stepMaxDb = dataArrayFreq[i];
        var x2 = (i - startFreq / freqPerData) * freqPerData * xStep;
        if (x2 - lastX2 >= 1.00) {
            var y2 = 1.00 * freqHEIGHT / 140 * (stepMaxDb + 140) + 20;
            if (y2 < 0) y2 = 0; //<-140db
            //snmlCanvasMainCtx.moveTo(x2 ,freqHEIGHT-20 -y2/2);
            snmlCanvasMainCtx.moveTo(x2, snmlCanvasMain.height - 20 - y2);
            snmlCanvasMainCtx.lineTo(x2, snmlCanvasMain.height - 20);
            stepMaxDb = -200.00;
            lastX2 = x2;
        }

        if (yMax2 < dataArrayFreq[i]) { yMax2 = dataArrayFreq[i]; iMax2 = i; }
        if (yMin2 > dataArrayFreq[i]) { yMin2 = dataArrayFreq[i]; iMin2 = i; }
    }
    /**********/
    snmlCanvasMainCtx.stroke();

    var fMax2 = iMax2 * audioCtx.sampleRate / 2 / (bufferLengthFreq - 1);
    var fMin2 = iMin2 * audioCtx.sampleRate / 2 / (bufferLengthFreq - 1);

    snmlCanvasMainCtx.font = '12px Arial';

    snmlCanvasMainCtx.fillStyle = inputColor.value;
    snmlCanvasMainCtx.fillText("Max: " + Math.round(yMax2) + "db, " + Math.round(fMax2) + "hz", freqWIDTH / 2 + 20, snmlCanvasMain.height / 2 + 15);
    snmlCanvasMainCtx.fillText("Min: " + Math.round(yMin2) + "db, " + Math.round(fMin2) + "hz", freqWIDTH / 2 + 20, snmlCanvasMain.height / 2 + 30);

}

window.onresize = function () {
    snmlCanvasMain.width = mainSection.offsetWidth;
    snmlCanvasMain.height = screen.height / 2;

}
window.onresize();