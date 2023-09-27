let fieldData = {};
let apiToken;
let isSpinning = false;
let theWheel;
let raiders = [];

let container = document.getElementById('container');

const altColors = [
    '#FF4A80', '#FF7070', '#FA8E4B', '#FEE440',
    '#5FFF77', '#00F5D4', '#00BBF9', '#4371FB',
    '#9B5DE5', '#F670DD',
];

const getColorBasedOnId = (userId) => {
    const number = Number.parseInt(userId, 10);
    return altColors[number % altColors.length];
};

const checkPrivileges = (data, privileges) => {
    const {tags, userId} = data;
    const {mod, subscriber, badges} = tags;
    const required = privileges || fieldData.privileges;
    const isMod = parseInt(mod);
    const isSub = parseInt(subscriber);
    const isVip = (badges.indexOf("vip") !== -1);
    const isBroadcaster = (userId === tags['room-id']);
    if (isBroadcaster) return true;
    if (required === "justSubs" && isSub) return true;
    if (required === "mods" && isMod) return true;
    if (required === "vips" && (isMod || isVip)) return true;
    if (required === "subs" && (isMod || isVip || isSub)) return true;
    return required === "everybody";
};

const showWheel = () => {
    container.className = '';
};

const hideWheel = () => {
    container.className = 'hidden';
    isSpinning = false;
};

const spinEnd = () => {
    const {doTTS, ttsVoice, ttsMessage, showDuration, volume} = fieldData;
    if(showDuration > 0){
        setTimeout(hideWheel, showDuration * 1000);
    } else {
        isSpinning = false;
    }

    if(!doTTS){
        return;
    }
    const winningSegment = theWheel.getIndicatedSegment();
    const message = ttsMessage.replace('$NAME', winningSegment.text);
    const url = `//api.streamelements.com/kappa/v2/speech?voice=${ttsVoice.replace('$', '')}&text=${encodeURI(message)}&key=${apiToken}`
    const myAudio = new Audio(url);
    myAudio.volume = volume;
    myAudio.play();
};

const getWeightData = () => {
    const colors = fieldData.segmentColors.split(',')
    return raiders.map((raider, index) => {
        return {
            text: raider,
            weight: 1,
            fillStyle: colors[index % colors.length],
        }
    })
};

const getSegments = () => {
    const weightData = getWeightData();
    const sumOfWeights = weightData.reduce((sum, segment)  => sum + segment.weight, 0);
    return weightData.map(segment => ({...segment, size: 360 * (segment.weight / sumOfWeights) }));
};

const drawWheel = () => {
    const {wheelSize, textSize, cooldown, spins} = fieldData;
    const segments = getSegments();
    theWheel = new Winwheel({
        'outerRadius': wheelSize / 2,        // Set outer radius so wheel fits inside the background.
        'innerRadius': 0,
        'textFontSize': textSize,         // Set default font size for the segments.
        'textOrientation': 'vertical', // Make text vertial so goes down from the outside of wheel.
        'textAlignment': 'outer',    // Align text to outside of wheel.
        'numSegments': segments.length,         // Specify number of segments.
        'segments': segments,          // Define segments including colour and text.
        'animation':           // Specify the animation to use.
            {
                'type': 'spinToStop',
                'duration': cooldown,     // Duration in seconds.
                'spins': spins,     // Default number of complete spins.
                'callbackFinished' : 'spinEnd()'
            }
    });
};

const spin = () => {
    if(isSpinning){
        return;
    }
    isSpinning = true;
    drawWheel();
    showWheel();
    setTimeout( () => {
        theWheel.rotationAngle = 0;
        theWheel.stopAnimation(false);
        theWheel.animation.spins = fieldData.spins;
        theWheel.startAnimation();
    }, 0);

};

window.addEventListener('onEventReceived', function (obj) {
    const {listener, event} = obj.detail;
    if (listener !== "message") {
        return;
    }
    const {data} = event;
    if(!checkPrivileges(data)) {
        return;
    }
    const { spinCommand, addCommand, removeCommand } = fieldData;
    const {text} = data;
    const textIsSpin = text.toLowerCase() === spinCommand.toLowerCase();
    const textIsAdd = text.toLowerCase().startsWith(addCommand.toLowerCase());
    const textIsRemove = text.toLowerCase().startsWith(removeCommand.toLowerCase());
    if(textIsSpin){
        spin();
        return;
    }
    if(textIsAdd){
        const raiderToAdd = text.substr(addCommand.length).trim();
        raiders.push(raiderToAdd);
        return;
    }
    if(textIsRemove){
        const raiderToRemove = text.substr(removeCommand.length).trim();
        raiders = raiders.filter(r => r !== raiderToRemove);
        return;
    }
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    apiToken = obj.detail.channel.apiToken;
});
