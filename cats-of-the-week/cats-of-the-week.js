let fieldData;

const main = document.getElementById('main');
const niceCatImage = document.getElementById('nice-cat-image');
const niceCatName = document.getElementById('nice-cat-name');
const niceCatReason = document.getElementById('nice-cat-reason');
const naughtyCatImage = document.getElementById('naughty-cat-image');
const naughtyCatName = document.getElementById('naughty-cat-name');
const naughtyCatReason = document.getElementById('naughty-cat-reason');

const shouldNotLogUser = ({text, name ,nick}) => {
    if(data.ignorePrefixList.some(prefix => text.startsWith(prefix))){
        return true;
    }
    const names = [name.toLowerCase() , nick.toLowerCase()];
    if(data.ignoreUserList.some(user => names.includes(user.toLowerCase()))){
        return true;
    }
    return false;
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

const uniqueUsers = {};

const show = () => {
    mainContainer.className = '';
};

const hide = () => {
    mainContainer.className = 'hidden';
};

const onMessage = (event) => {
    const {nick = '', name = '', text = ''} = event.data;
    const {command, duration, privileges} = fieldData;

    if(text === command && checkPrivileges(data, privileges)){
        show();
        setTimeout(() => {
            hide();
        }, duration * 1000);
    }

    if(shouldNotLogUser({text, name, nick})){
        return;
    }
    uniqueUsers[name] = 1;
};

window.addEventListener('onEventReceived', obj => {
    const {listener, event} = obj?.detail || {};
    if(listener !== 'message'){
        return;
    }
    onMessage(event);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
});
