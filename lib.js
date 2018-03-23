(function() {
    var audCon = new (window.AudioContext || window.webkitAudioContext || alert("Could not find audio context"))();
    var audComp = audCon.createDynamicsCompressor();
    audComp.threshold.value = -50;
    audComp.knee.value = 40;
    audComp.ratio.value = 12;
    audComp.attack.value = 0;
    audComp.release.value = 0;
    audComp.connect(audCon.destination);
    
    var createTone = function(freq, dur, callback) {
        console.log("Begining " + freq + " for " + dur);
        var oss = audComp.createOscillator();
        oss.frequency.value = freq;
        oss.connect(audComp);
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
        console.log("Transmitting " + byte + "...");
        if ((byte < 0) || (byte > 255)) {
            return false;
        }
        var bits = {};
        var check = 8;
        for (var i = 8; i > 0; --i) {
            var v = 2 ** i;
            if (v <= byte) {
                createTone((i - 1) * binSize + baseFreq, dur, (callback) ? function() {
                    if ((--check) == 0) {
                        callback();
                    }
                } : null);
                byte -= v;
            }
        }
    }
    
    var transmitBytes = function(bytes, dur, callback) {
        if ((typeof bytes) !== "string") {
            return false;
        }
        var i = 0;
        var a;
        a = function() {
            if ((++i) > bytes.length) {
                if (callback) callback(true);
                return;
            }
            if (!transmitByte(bytes.charCodeAt(0), dur, a)) {
                if (callback) callback(false);
                return;
            }
        }
    }
    window.transmitBytes = transmitBytes;
})();
