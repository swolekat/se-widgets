var elemclass= '.octagon';
var px = 0,xx = 100,yy=100;
var py = 180;
var sp = 1;
$('*').keydown(
    function(e)
    {
        pers1 = parseInt($('body').css("perspective"));
        if(event.which == 38)
        {py+=sp;     $(elemclass).css("transform","rotateY("+px+"deg)rotateX("+py +"deg)");}
        if(event.which == 40)
        {py-=sp;      $(elemclass).css("transform","rotateY("+px+"deg)rotateX("+py +"deg)");}
        if(event.which == 37)
        {px+=sp;     $(elemclass).css("transform","rotateY("+px+"deg)rotateX("+py +"deg)");}
        if(event.which == 39)
        {px-=sp;     $(elemclass).css("transform","rotateY("+px+"deg)rotateX("+py +"deg)");}
        if(event.which == 83)
        {xx--;$('body').css("perspective",(pers1+xx)+"");}
        if(event.which == 87)
        {xx++;$('body').css("perspective",(pers1-xx)+"");}
    });

const octagon = document.getElementById('octagon');
const face0 = document.getElementById('face0');
const face1 = document.getElementById('face1');
const face2 = document.getElementById('face2');
const face3 = document.getElementById('face3');
const face4 = document.getElementById('face4');
const face5 = document.getElementById('face5');
const face6 = document.getElementById('face6');
const face7 = document.getElementById('face7');
const origin = document.getElementById('origin');
const origin2 = document.getElementById('origin2');

let octagonInterval = setInterval(() => {
    const width = face0.getBoundingClientRect()?.width;
    if(width === 0){
        return;
    }
    clearInterval(octagonInterval);
    initOctagon();
}, 300);

const initOctagon = () => {
    const { width, height } = face0.getBoundingClientRect();
    //22.5 is half of 45
    const zDistance = (height / (Math.sin(22.5 * (Math.PI / 180)))) * -1;
    face0.style = `transform: translateY(-${height/2}px) translateZ(${zDistance}px) rotateX(180deg)`;
    const face1Y = height * 0.3555;
    const face1Z = zDistance * 0.8638;
    face1.style = `transform: translateY(${face1Y}px) translateZ(${face1Z}px) rotateX(225deg)`;
    const face2Y = height * 0.7074;
    const face2Z = zDistance * 0.5404;
    face2.style = `transform: translateY(${face2Y}px) translateZ(${face2Z}px) rotateX(270deg)`;
    const face3Y = height * 0.3518;
    const face3Z = zDistance * 0.2156;
    face3.style = `transform: translateY(${face3Y}px) translateZ(${face3Z}px) rotateX(315deg)`;
    const face4Y = (height/2) * -1;
    const face4Z = zDistance * 0.0809;
    face4.style = `transform: translateY(${face4Y}px) translateZ(${face4Z}px) rotateX(0deg)`;
    const face5Y = height * -1.3519;
    const face5Z = zDistance * 0.2170;
    face5.style = `transform: translateY(${face5Y}px) translateZ(${face5Z}px) rotateX(45deg)`;
    const face6Y = height * -1.7111111;
    const face6Z = zDistance * 0.5404;
    face6.style = `transform: translateY(${face6Y}px) translateZ(${face6Z}px) rotateX(90deg)`;
    const face7Y = height * -1.3519;
    const face7Z = zDistance * 0.863;
    face7.style = `transform: translateY(${face7Y}px) translateZ(${face7Z}px) rotateX(135deg)`;

    const octagonRect = octagon.getBoundingClientRect();
    // roughly should be 854
    const transformOriginX = zDistance * -1.2113
    octagon.style = `transform-origin: ${octagonRect.width/2}px ${octagonRect.height/2}px translateZ(${zDistance/2}px)`;
    origin.style = `transform: translateX(${octagonRect.width/2}px) translateY(${octagonRect.height/2}px) translateZ(${zDistance/2}px)`;
    origin2.style = `transform: translateX(${octagonRect.width/2}px) translateY(${octagonRect.height/2}px) translateZ(${zDistance/2}px) rotateY(90deg)`;

};



// let fieldData = {};
// let apiToken;
// let isSpinning = false;
// let theWheel;
// let raiders = [];
//
// let container = document.getElementById('container');
//
// const altColors = [
//     '#FF4A80', '#FF7070', '#FA8E4B', '#FEE440',
//     '#5FFF77', '#00F5D4', '#00BBF9', '#4371FB',
//     '#9B5DE5', '#F670DD',
// ];
//
// const getColorBasedOnId = (userId) => {
//     const number = Number.parseInt(userId, 10);
//     return altColors[number % altColors.length];
// };
//
// const checkPrivileges = (data, privileges) => {
//     const {tags, userId} = data;
//     const {mod, subscriber, badges} = tags;
//     const required = privileges || fieldData.privileges;
//     const isMod = parseInt(mod);
//     const isSub = parseInt(subscriber);
//     const isVip = (badges.indexOf("vip") !== -1);
//     const isBroadcaster = (userId === tags['room-id']);
//     if (isBroadcaster) return true;
//     if (required === "justSubs" && isSub) return true;
//     if (required === "mods" && isMod) return true;
//     if (required === "vips" && (isMod || isVip)) return true;
//     if (required === "subs" && (isMod || isVip || isSub)) return true;
//     return required === "everybody";
// };
//
// const showWheel = () => {
//     container.className = '';
// };
//
// const hideWheel = () => {
//     container.className = 'hidden';
//     isSpinning = false;
// };
//
// const spinEnd = () => {
//     const {doTTS, ttsVoice, ttsMessage, showDuration, volume} = fieldData;
//     if(showDuration > 0){
//         setTimeout(hideWheel, showDuration * 1000);
//     } else {
//         isSpinning = false;
//     }
//
//     if(!doTTS){
//         return;
//     }
//     const winningSegment = theWheel.getIndicatedSegment();
//     const message = ttsMessage.replace('$NAME', winningSegment.text);
//     const url = `//api.streamelements.com/kappa/v2/speech?voice=${ttsVoice.replace('$', '')}&text=${encodeURI(message)}&key=${apiToken}`
//     const myAudio = new Audio(url);
//     myAudio.volume = volume;
//     myAudio.play();
// };
//
// const getWeightData = () => {
//     const colors = fieldData.segmentColors.split(',')
//     return raiders.map((raider, index) => {
//         return {
//             text: raider,
//             weight: 1,
//             fillStyle: colors[index % colors.length],
//         }
//     })
// };
//
// const getSegments = () => {
//     const weightData = getWeightData();
//     const sumOfWeights = weightData.reduce((sum, segment)  => sum + segment.weight, 0);
//     return weightData.map(segment => ({...segment, size: 360 * (segment.weight / sumOfWeights) }));
// };
//
// const drawWheel = () => {
//     const {wheelSize, textSize, cooldown, spins} = fieldData;
//     const segments = getSegments();
//     theWheel = new Winwheel({
//         'outerRadius': wheelSize / 2,        // Set outer radius so wheel fits inside the background.
//         'innerRadius': 0,
//         'textFontSize': textSize,         // Set default font size for the segments.
//         'textOrientation': 'vertical', // Make text vertial so goes down from the outside of wheel.
//         'textAlignment': 'outer',    // Align text to outside of wheel.
//         'numSegments': segments.length,         // Specify number of segments.
//         'segments': segments,          // Define segments including colour and text.
//         'animation':           // Specify the animation to use.
//             {
//                 'type': 'spinToStop',
//                 'duration': cooldown,     // Duration in seconds.
//                 'spins': spins,     // Default number of complete spins.
//                 'callbackFinished' : 'spinEnd()'
//             }
//     });
// };
//
// const spin = () => {
//     if(isSpinning){
//         return;
//     }
//     isSpinning = true;
//     drawWheel();
//     showWheel();
//     setTimeout( () => {
//         theWheel.rotationAngle = 0;
//         theWheel.stopAnimation(false);
//         theWheel.animation.spins = fieldData.spins;
//         theWheel.startAnimation();
//     }, 0);
//
// };
//
// window.addEventListener('onEventReceived', function (obj) {
//     const {listener, event} = obj.detail;
//     if (listener !== "message") {
//         return;
//     }
//     const {data} = event;
//     if(!checkPrivileges(data)) {
//         return;
//     }
//     const { spinCommand, addCommand, removeCommand } = fieldData;
//     const {text} = data;
//     const textIsSpin = text.toLowerCase() === spinCommand.toLowerCase();
//     const textIsAdd = text.toLowerCase().startsWith(addCommand.toLowerCase());
//     const textIsRemove = text.toLowerCase().startsWith(removeCommand.toLowerCase());
//     if(textIsSpin){
//         spin();
//         return;
//     }
//     if(textIsAdd){
//         const raiderToAdd = text.substr(addCommand.length).trim();
//         raiders.push(raiderToAdd);
//         return;
//     }
//     if(textIsRemove){
//         const raiderToRemove = text.substr(removeCommand.length).trim();
//         raiders = raiders.filter(r => r !== raiderToRemove);
//         return;
//     }
// });
//
// window.addEventListener('onWidgetLoad', function (obj) {
//     fieldData = obj.detail.fieldData;
//     apiToken = obj.detail.channel.apiToken;
// });
