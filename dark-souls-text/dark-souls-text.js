let fieldData;

const mainContainer = document.getElementById('main-container');
const sound = document.getElementById('sound');
const backgroundText = document.getElementById('background-text');
const mainText = document.getElementById('main-text');

let isShowing = true;

const hide = () => mainContainer.className = 'main-container hidden';
const show = () => mainContainer.className = 'main-container';

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
    const {text} = data;

    if (!checkPrivileges(data)) {
        return;
    }

    const { command, } = fieldData;
    const startsWithCommand = text.toLowerCase().startsWith(command.toLowerCase());

    if(!startsWithCommand || isShowing){
        return;
    }

    isShowing = true;
    const caption = text.toLowerCase().replace(command.toLowerCase(), '').trim().toUpperCase();
    backgroundText.innerText = caption;
    mainText.innerText = caption;
    sound.play();

    show();
    // setTimeout(() => {
    //     const nextFace = getNextFace();
    //     coin.className = `coin ${currentFace}-to-${nextFace}`;
    //     currentFace = nextFace;
    //     setTimeout(() => {
    //         hide();
    //         coin.className = `coin ${currentFace}`;
    //         isShowing = false;
    //     }, 5000);
    // }, 2000);
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;

    if(fieldData.preview){
        show();
    }
});

