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

    var transmitNumber = function(n, numberBase, baseFreq, binSize, dur, callback) {
        console.log("> " + n + "/" + numberBase);
        if ((n < 0) || (n >= max)) {
            return false;
        }
        createTone(n * binSize + baseFreq, dur, callback);
        return true;
    }

    var transmitBytes = function(bytes, baseFreq, binSize, binCount, dur, callback) {
        if (binCount > 256) {
            return false;
        } else {
            var l = Math.log2(binCount);
            if (Math.floor(l) !== l) {
                return false;
            }
            binCount = l;
        }
        console.log("OK");
        var ns = bytes;
        if (binCount != 8) {
            var bits = new Uint8Array(Math.ceil(8 * bytes.length / binCount) * binCount);
            for (var i = 0; i < bytes.length; ++i) {
                var n = bytes[i];
                for (let j = 15; j >= 0; --j) {
                    let v = 2 ** j;
                    if (n >= v) {
                        n -= v;
                        bits[i * 8 + j] = 1;
                    }
                }
            }
            for (var i = (bytes.length * 8); i < bits.length; ++i) {
                bits[i] = 0;
            }
            ns = new Uint8Array(bits.length / binCount);
            for (var i = 0; i < ns.length; ++i) {
                ns[i] = 0;
                for (var j = 0; j < binCount; ++j) {
                    if (bits[i * binCount + j] == 1) {
                        ns[i] += 2 ** j;
                    }
                }
            }
        }
        var i = 0;
        var a;
        a = function() {
            if (i >= ns.length) {
                if (callback) callback(true);
                return;
            }
            if (!transmitNumber(ns[i], binCount, baseFreq, binSize, dur, a)) {
                if (callback) callback(false);
                return;
            }
            ++i;
        }
        a();
    }
    window.transmitBytes = transmitBytes;

    var transmitString = function(s, p1, p2, p3, p4, p5) {
        var d = new Uint16Array(s.length);
        for (var i = 0; i < s.length; ++i) d[i] = s.charCodeAt(i);
        return transmitBytes(new Uint8Array(d.buffer), p1, p2, p3, p4, p5);
    }
    window.transmitString = transmitString;

    // Receive Section

    var addByteListener = function(baseFreq, binSize, binCount, dur, callback) {
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
                var c = 0;
                var max = -1/0;
                for (var i = 0; i < binCount; ++i) {
                    var f = baseFreq + binSize * i;
                    var index = Math.floor(f / fftBinSize + 0.5);
                    //console.log(index + "/" + data.length + " (" + (index * fftBinSize) + "/" + f + "): " + data[index]);
                    if (data[index] > max) {
                        max = data[index];
                        c = i;
                    }
                }
                console.log(c + ": " + max);
                //callback(b);
            }, 10);
        }).catch(function (e) {
            alert("Could not load receiver: " + e);
        });
    };
    window.addByteListener = addByteListener;
})();
