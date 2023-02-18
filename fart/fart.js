let fieldData;

const mainContainer = document.getElementById('main-container');
const fart = document.getElementById('fart');
const sound = document.getElementById('sound');

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

const hide = () => {
    fart.className = 'fart hidden';
};

const fartSize = 200;
let timeout;

const doFart = () => {
    if(timeout){
        clearTimeout(timeout);
        timeout = undefined;
    }
    hide();
    const {height, width} = mainContainer.getBoundingClientRect();
    fart.style.top = `${Math.random() * (height - fartSize)}px`;
    fart.style.left = `${Math.random() * (width - fartSize)}px`;
    fart.className = 'fart';
    sound.play();
    timeout = setTimeout(() => {
        hide();
    }, 10000);
};

const handleMessage = (obj) => {
    const fartCommand = fieldData.fartCommand;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.startsWith(fartCommand);
    if(!textStartsWithCommand || !checkPrivileges(data)){
        return;
    }
    doFart();
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
});

