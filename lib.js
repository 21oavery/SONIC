(function() {
    var audCon = new (window.AudioContext || window.webkitAudioContext || alert("Could not find audio context"))();

    // Transmit Section

    /*var audComp = audCon.createDynamicsCompressor();
    audComp.threshold.setValueAtTime(-50, audCon.currentTime);
    audComp.knee.setValueAtTime(40, audCon.currentTime);
    audComp.ratio.setValueAtTime(12, audCon.currentTime);
    audComp.attack.setValueAtTime(0, audCon.currentTime);
    audComp.release.setValueAtTime(0, audCon.currentTime);
    audComp.connect(audCon.destination);*/
    var audGain = audCon.createGain();
    audGain.gain.setValueAtTime(0.125, audCon.currentTime);
    audGain.connect(audCon.destination);

    var createTone = function(freq, dur, callback) {
        var oss = audCon.createOscillator();
        oss.frequency.setValueAtTime(freq, audCon.currentTime);
        oss.connect(audGain);
        oss.start();
        setTimeout(function() {
            oss.stop();
            oss.disconnect();
            if (callback) callback();
        }, dur);
    }

    var transmitByte = function(byte, baseFreq, binSize, dur, callback) {
        console.log("> " + String.fromCharCode(byte));
        if ((byte < 0) || (byte > 255)) {
            return false;
        }
        var bits = {};
        var check = 0;
        for (var i = 8; i > 0; --i) {
            var v = 2 ** i;
            if (v <= byte) {
                ++check;
                createTone((i - 1) * binSize + baseFreq, dur, callback ? function() {
                    if ((--check) == 0) {
                        callback();
                    }
                } : null);
                byte -= v;
            }
        }
        return true;
    }

    var transmitBytes = function(bytes, baseFreq, binSize, dur, callback) {
        if ((typeof bytes) !== "string") {
            return false;
        }
        var i = 0;
        var a;
        a = function() {
            if (i >= bytes.length) {
                if (callback) callback(true);
                return;
            }
            if (!transmitByte(bytes.charCodeAt(i), baseFreq, binSize, dur, a)) {
                if (callback) callback(false);
                return;
            }
            ++i;
        }
        a();
    }
    window.transmitBytes = transmitBytes;

    // Receive Section

    var addByteListener = function(baseFreq, binSize, dur, callback) {
        navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function(stream) {
            var mic = audCon.createMediaStreamSource(stream);
            var audAn = audCon.createAnalyser();
            audAn.minDecibels = -90;
            audAn.maxDecibels = -10;
            // binSize = (audCon.sampleRate / 2) / fftSize
            // fftSize = (audCon.sampleRate / 2) / binSize
            var fftSize = 4096; //Math.ceil(audCon.sampleRate / 2 / binSize);
            var fftBinSize = audCon.sampleRate / fftSize;
            audAn.fftSize = fftSize;
            var data = new Float32Array(audAn.frequencyBinCount);
            setInterval(function() {
                audAn.getFloatFrequencyData(data);
                var b = 0;
                for (var i = 0; i < 8; ++i) {
                    var f = baseFreq + binSize * i;
                    var index = Math.floor(f / fftBinSize + 0.5);
                    //console.log(index + "/" + data.length + " (" + (index * fftBinSize) + "/" + f + "): " + data[index]);
                    b += ((data[index] >= 0.01) ? 1 : 0) * (2 ** i);
                }
                //callback(b);
            }, 10);
        }).catch(function (e) {
            alert("Could not load receiver: " + e);
        });
    };
    window.addByteListener = addByteListener;
})();
