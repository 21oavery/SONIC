(function() {
    var audCon = window.AudioContext || window.webkitAudioContext;
    if (audCon) {
        audCon = new audCon();
    } else {
        alert("Could not load sound lib: no audio context");
        return;
    }

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
