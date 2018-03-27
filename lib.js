(function() {
    var audCon = new (window.AudioContext || window.webkitAudioContext || alert("Could not find audio context"))();
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

    var baseFreq = 17000;
    var binCount = 8;
    var binSize = 250;
    var transmitByte = function(byte, dur, callback) {
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
                createTone((i - 1) * binSize + baseFreq, dur, (callback) ? function() {
                    if ((--check) == 0) {
                        callback();
                    }
                } : null);
                byte -= v;
            }
        }
        return true;
    }

    var transmitBytes = function(bytes, dur, callback) {
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
            if (!transmitByte(bytes.charCodeAt(i), dur, a)) {
                if (callback) callback(false);
                return;
            }
            ++i;
        }
        a();
    }
    window.transmitBytes = transmitBytes;
})();
