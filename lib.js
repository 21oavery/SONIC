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
    window.createTone = createTone;
})();
