(() => {
    if (window.__sunoAppEnhancementsInstalled) return;
    window.__sunoAppEnhancementsInstalled = true;

    const state = {
        audioContext: null,
        audioElement: null,
        source: null,
        filters: [],
        convolver: null,
        dryGain: null,
        wetGain: null,
        compressor: null,
        analyser: null,
        waveformFrame: null,
        waveformPeaks: null,
        waveformSource: '',
        trackKey: '',
        activeTrackRow: null,
        sourceActions: {},
        themeSource: '',
        themeStart: '#ff5474',
        themeEnd: '#ff8a5c',
        profileSource: null,
        mode: localStorage.getItem('sunoapp-sound-mode') || 'flat',
        waveformEnabled: localStorage.getItem('sunoapp-waveform-enabled') !== 'false',
        customPlayerEnabled: localStorage.getItem('sunoapp-custom-player-enabled') !== 'false'
    };

    const frequencies = [60, 230, 910, 3600, 14000];
    const presets = {
        flat: [0, 0, 0, 0, 0],
        bass: [7, 4, 1, -1, 0],
        vocal: [-2, 0, 3, 5, 2],
        clarity: [-2, -1, 1, 4, 6],
        immersive: [4, 1, -1, 2, 5],
        cinema51: [5, 2, -2, 3, 4],
        surround71: [3, 0, -2, 4, 6],
        atmos: [2, -1, 0, 5, 7]
    };
    const spatialMix = { flat: 0, bass: .02, vocal: .015, clarity: .025, immersive: .1, cinema51: .14, surround71: .19, atmos: .24, custom: .04 };
