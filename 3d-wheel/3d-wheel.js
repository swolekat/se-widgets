const octagon = document.getElementById('octagon');
const face0 = document.getElementById('face0');
const face1 = document.getElementById('face1');
const face2 = document.getElementById('face2');
const face3 = document.getElementById('face3');
const face4 = document.getElementById('face4');
const face5 = document.getElementById('face5');
const face6 = document.getElementById('face6');
const face7 = document.getElementById('face7');
const face0Content = document.getElementById('face0Content');
const face1Content = document.getElementById('face1Content');
const face2Content = document.getElementById('face2Content');
const face3Content = document.getElementById('face3Content');
const face4Content = document.getElementById('face4Content');
const face5Content = document.getElementById('face5Content');
const face6Content = document.getElementById('face6Content');
const face7Content = document.getElementById('face7Content');

const faceElements = [
    {
    face: face0,
    content: face0Content,
},
    {
        face: face1,
        content: face1Content,
    },
    {
        face: face2,
        content: face2Content,
    },
    {
        face: face3,
        content: face3Content,
    },
    {
        face: face4,
        content: face4Content,
    },
    {
        face: face5,
        content: face5Content,
    },
    {
        face: face6,
        content: face6Content,
    },
    {
        face: face7,
        content: face7Content,
    },
];

let octagonInterval = setInterval(() => {
    const width = face0.getBoundingClientRect()?.width;
    if(width === 0){
        return;
    }
    clearInterval(octagonInterval);
    initOctagon();
}, 300);

const initOctagon = () => {
    const { height } = face0.getBoundingClientRect();
    //22.5 is half of 45
    const zDistance = (height / (Math.sin(22.5 * (Math.PI / 180)))) * 0.5;
    face0.style = `transform: rotateX(0deg) translateY(-${height/2}px) translateZ(${zDistance}px)`;
    const face1Y = height * -0.4296;
    const face1Z = zDistance * 0.70738;
    face1.style = `transform: rotateX(315deg) translateY(${face1Y}px) translateZ(${face1Z}px) `;
    const face2Y = height * -0.1074;
    const face2Z = zDistance * 0.5404;
    face2.style = `transform: rotateX(270deg) translateY(${face2Y}px) translateZ(${face2Z}px) `;
    const face3Y = height * 0.2704;
    const face3Z = zDistance * 0.59375;
    face3.style = `transform: rotateX(225deg) translateY(${face3Y}px) translateZ(${face3Z}px)`;
    const face4Y = height * 0.4962;
    const face4Z = zDistance * 0.835227;
    face4.style = `transform: rotateX(180deg) translateY(${face4Y}px) translateZ(${face4Z}px) `;
    const face5Y = height * 0.4296;
    const face5Z = zDistance * 1.125;
    face5.style = `transform: rotateX(135deg) translateY(${face5Y}px) translateZ(${face5Z}px) `;
    const face6Y = height * 0.1185;
    const face6Z = zDistance * 1.298;
    face6.style = `transform: rotateX(90deg) translateY(${face6Y}px) translateZ(${face6Z}px) `;
    const face7Y = height * -0.2777;
    const face7Z = zDistance * 1.2443;
    face7.style = `transform: rotateX(45deg) translateY(${face7Y}px) translateZ(${face7Z}px)`;

    drawWheel();
};



let fieldData = {};
let apiToken;
let isSpinning = false;
let realItems = [];
let currentItemIndex = 0;
let currentFaceIndex = 0;
let segmentsToGo = 0;
let winnerIndex;
let maxSegments;

let container = document.getElementById('container');

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
    $('#octagon').velocity({rotateX: '0'}, {duration: 0});
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
    const winningSegment = realItems[winnerIndex];
    const message = ttsMessage.replace('$NAME', winningSegment);
    const url = `//api.streamelements.com/kappa/v2/speech?voice=${ttsVoice.replace('$', '')}&text=${encodeURI(message)}&key=${apiToken}`
    const myAudio = new Audio(url);
    myAudio.volume = volume;
    myAudio.play();
};

// going up increase the degrees

const drawWheel = () => {
    // render previous item and that's it.
    const colors = fieldData.segmentColors.split(',');

    face0.style.background = colors[0];
    face0Content.innerHTML = realItems[0];

    face1.style.background = colors[1 % colors.length];
    face1Content.innerHTML = realItems[1];

    face2.style.background = colors[2 % colors.length];
    face2Content.innerHTML = realItems[2];

    face3.style.background = colors[3 % colors.length];
    face3Content.innerHTML = realItems[3];

    face4.style.background = colors[4 % colors.length];
    face4Content.innerHTML = realItems[4];

    face5.style.background = colors[5 % colors.length];
    face5Content.innerHTML = realItems[5];

    face6.style.background = colors[6 % colors.length];
    face6Content.innerHTML = realItems[6];

    // last face is special. Need to give it the illusion that it's the last item in the array
    face7.style.background = colors[(realItems.length -1) % colors.length];
    face7Content.innerHTML = realItems[(realItems.length -1)];

};

const getSpeed = () => {
    const segmentsAlreadyGone = maxSegments - segmentsToGo;
    const segmentPercentage = segmentsAlreadyGone / maxSegments;
    const easingValue =  segmentPercentage < 0.5 ? 4 * segmentPercentage * segmentPercentage * segmentPercentage : 1 - Math.pow(-2 * segmentPercentage + 2, 3) / 2;
    return 200 + (700 * easingValue);
};

const spinSection = () => {
    if(segmentsToGo === 0){
        spinEnd();
        return;
    }
    const newSelectedIndex = currentItemIndex + 1;
    const newItemIndex = (newSelectedIndex + 5) % realItems.length;
    const faceToUpdateIndex = (currentFaceIndex + 6) % 8;

    const colors = fieldData.segmentColors.split(',');
    const faceToUpdate = faceElements[faceToUpdateIndex];
    faceToUpdate.face.style.background = colors[newItemIndex % colors.length];
    faceToUpdate.content.innerHTML = realItems[newItemIndex];
    currentItemIndex = (currentItemIndex + 1) % realItems.length;
    currentFaceIndex = (currentFaceIndex + 1) % 8;
    const speed = getSpeed();
    segmentsToGo -=1;
    $('#octagon').velocity({rotateX: '+=45'}, {duration: speed, easing: 'linear', complete: spinSection});

};

const spin = () => {
    if(isSpinning){
        return;
    }
    isSpinning = true;

    showWheel();
    const numberOfSpins = 3;
    winnerIndex = Math.round((Math.random() * 10000)) % realItems.length;
    segmentsToGo = (numberOfSpins * realItems.length) + winnerIndex;
    maxSegments = segmentsToGo;

    setTimeout( () => {
        spinSection();
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
    const { spinCommand } = fieldData;
    const {text} = data;
    const textIsSpin = text.toLowerCase() === spinCommand.toLowerCase();
    if(textIsSpin){
        spin();
        return;
    }
});

const processItems = () => {
    const items = fieldData.items.split(',');
    if(items.length >= 8) {
        realItems = [...items];
        return;
    }
    do {
        realItems = [...realItems, ...items];
    } while(realItems.length < 8)
};

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    apiToken = obj.detail.channel.apiToken;
    processItems();
});
