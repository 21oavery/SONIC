(function() {
    var audCon = new (window.AudioContext || window.webkitAudioContext || alert("Could not find audio context"))();
    var audComp = audCon.createDynamicsCompressor();
    audComp.threshold.value = -50;
    audComp.knee.value = 40;
    audComp.ratio.value = 12;
    audComp.attack.value = 0;
    audComp.release.value = 0;
    audComp.connect(audCon.destination);

    var toneCache = {};
    var createTone = function(freq, dur, callback) {
        var oss = audComp.createOscillator();
        toneCache[freq] = oss;
        oss.frequency.value = freq;
        oss.connect(audComp);
        oss.start();
        setTimeout(function() {
            oss.stop();
            oss.disconnect();
            if (callback) callback();
        }, dur);
    }

    var baseFreq = 18000;
    var incFreq = 200;
    var binsFreq = 8;
    var transmitByte = function(byte, dur, callback) {
        if ((byte < 0) || (byte > 255)) {
            return false;
        }
        var bits = {};
        for (var i = 8; i > 0; i--) {
            var v = 2 ** i;
            if (v <= byte) {
                createTone((i - 1) * incFreq + baseFreq, dur);
                byte -= v;
            }
        }
    }
    window.transmitByte = transmitByte;
})();
