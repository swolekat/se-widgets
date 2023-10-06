let fieldData;

const mainContainer = document.getElementById('main-container');
const textElement = document.getElementById('text');

let isShowing = false;

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

    const command = fieldData.command;
    const startsWithCommand = text.toLowerCase().startsWith(command.toLowerCase());

    if(!startsWithCommand || isShowing){
        return;
    }

    isShowing = true;
    const whoWillRemember = text.toLowerCase().replace(command.toLowerCase(), '').trim();
    textElement.innerText = `${whoWillRemember} will remember that.`;

    show();
    setTimeout(() => {
        hide();
        isShowing = false;
    }, 5000);
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

