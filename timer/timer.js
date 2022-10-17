let fieldData;

let time = 0;
let timeRemaining = 0;
let interval;

const mainContainer = document.getElementById('main-container');
const timer = document.getElementById('timer');
const sound = document.getElementById('sound');

const formatTime = t => {
    const minutes = Math.floor(t/60);
    const seconds = t % 60;

    return `${minutes}:${seconds < 10 ? '' : '0'}${seconds}`;
};

const hide = () => mainContainer.className = 'main-container hidden';
const show = () => mainContainer.className = 'main-container';

const tick = () => {
    timeRemaining = timeRemaining -1;
    timer.innerHTML = formatTime(timeRemaining);
    if(timeRemaining !== 0){
        return;
    }
    clearInterval(interval);
    sound.play();
    setTimeout(() => {
        hide();
    }, 4000);
};

const start = (duration) => {
    time = duration * 60;
    timeRemaining = time + 1;
    if(interval){
        clearInterval(interval);
    }
    show();
    interval = setInterval(tick, 1000);
};

const end = () => {
    if(interval){
        clearInterval(interval);
    }
    hide();
};

const restart = () => {
    timeRemaining = time + 1;
    if(!interval){
        show();
        interval = setInterval(tick, 1000);
    }
};


const checkPrivileges = (data) => {
    const {tags, userId} = data;
    const {mod, subscriber, badges} = tags;
    const required = fieldData.privileges;
    const isMod = parseInt(mod);
    const isSub = parseInt(subscriber);
    const isVip = (badges.indexOf("vip") !== -1);
    const isBroadcaster = (userId === tags['room-id']);
    if (isBroadcaster) return true;
    if (required === "mods" && isMod) return true;
    if (required === "vips" && (isMod || isVip)) return true;
    if (required === "subs" && (isMod || isVip || isSub)) return true;
    return required === "everybody";
};

const handleMessage = (obj) => {
    const data = obj.detail.event.data;

    if (!checkPrivileges(data)) {
        return;
    }

    const { startCommand, endCommand, restartCommand } = fieldData;
    const {text} = data;
    const startsWithStart = text.toLowerCase().startsWith(startCommand.toLowerCase());
    const startsWithEnd = text.toLowerCase().startsWith(endCommand.toLowerCase());
    const startsWithRestart = text.toLowerCase().startsWith(restartCommand.toLowerCase());

    if(startsWithStart){
        const duration = text.toLowerCase().replace(startCommand, '').trim();
        start(duration);
        return;
    }

    if(startsWithEnd){
        end();
        return;
    }

    if(startsWithRestart){
        restart();
        return;
    }
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;

    const {fontSize, fontName, fontColor, volume} = fieldData;
    timer.style = `font-size: ${fontSize}px; font-family: '${fontName}'; color: ${fontColor};`;
    sound.volume = volume;
});

