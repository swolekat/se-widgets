let fieldData;

const mainContainer = document.getElementById('main-container');
const coin = document.getElementById('coin');

const hide = () => mainContainer.className = 'main-container hidden';
const show = () => mainContainer.className = 'main-container';
let currentFace = 'heads';
let isFlipping = false;

const getNextFace = () => {
    const number = Math.random();
    if(number < 0.5){
        return 'heads';
    }
    return 'tails';
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
    const {text} = data;

    if (!checkPrivileges(data)) {
        return;
    }

    const { flipCommand, } = fieldData;
    const startsWithFlip = text.toLowerCase().startsWith(flipCommand.toLowerCase());

    if(!startsWithFlip || isFlipping){
        return;
    }

    isFlipping = true;

    show();
    setTimeout(() => {
        const nextFace = getNextFace();
        coin.className = `coin ${currentFace}-to-${nextFace}`;
        currentFace = nextFace;
        setTimeout(() => {
            hide();
            coin.className = `coin ${currentFace}`;
            isFlipping = false;
        }, 5000);
    }, 2000);
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    currentFace = getNextFace();
    coin.className = `coin ${currentFace}`;

    if(fieldData.preview){
        show();
    }
});

