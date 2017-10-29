(function() {
    var audCon = new (window.AudioContext || window.webkitAudioContext || alert("Could not find audio context"))();

    var toneCache = {};
    var createTone = function(freq, dur, callback) {
        var oss = audCon.createOscillator();
        toneCache[freq] = oss;
        oss.frequency.value = freq;
        oss.connect(audCon.destination);
        oss.start();
        setTimeout(function() {
            oss.stop();
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
    var window.transmitByte = transmitByte;
})();
