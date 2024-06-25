let fieldData;

let time = 0;
let timeRemaining = 0;
let interval;

const mainContainer = document.getElementById('main-container');
const timer = document.getElementById('timer');
const sound = document.getElementById('sound');

const formatTime = t => {
    let realTime = t;
    if(fieldData.invertCount) {
        realTime = time - t;
    }
    const minutes = Math.floor(realTime/60);
    const seconds = realTime % 60;

    return `${minutes}:${seconds >= 10 ? '' : '0'}${seconds}`;
};

const hide = () => mainContainer.className = 'main-container hidden';
const show = () => mainContainer.className = 'main-container';

const tick = () => {
    timeRemaining = timeRemaining - 1;
    timer.innerHTML = formatTime(timeRemaining);
    show();
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
    if(Number.isNaN(duration)){
        duration = 999999999;
    }
    time = duration * 60;
    timeRemaining = time + 1;
    if(interval){
        clearInterval(interval);
    }
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
        interval = setInterval(tick, 1000);
    }
};

const pause = () => {
    clearInterval(interval);
};

const unpause = () => {
    interval = setInterval(tick, 1000);
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

const handleMessage = (obj) => {
    const data = obj.detail.event.data;

    if (!checkPrivileges(data)) {
        return;
    }

    const { startCommand, endCommand, restartCommand, pauseCommand, unpauseCommand } = fieldData;
    const {text} = data;
    const startsWithStart = text.toLowerCase().startsWith(startCommand.toLowerCase());
    const startsWithEnd = text.toLowerCase().startsWith(endCommand.toLowerCase());
    const startsWithRestart = text.toLowerCase().startsWith(restartCommand.toLowerCase());
    const startsWithPause = text.toLowerCase().startsWith(pauseCommand.toLowerCase());
    const startsWithUnpause = text.toLowerCase().startsWith(unpauseCommand.toLowerCase());

    if(startsWithStart){
        const duration = text.toLowerCase().replace(startCommand.toLowerCase(), '').trim();
        start(Number.parseInt(duration));
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

    if(startsWithPause){
        pause();
        return;
    }

    if(startsWithUnpause){
        unpause();
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

    const {volume, preview} = fieldData;
    if(preview){
        show();
    }
    sound.volume = volume;
});

