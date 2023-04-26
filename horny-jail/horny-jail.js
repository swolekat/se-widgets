let fieldData;

const mainContainer = document.getElementById('main-container');
const jailed = document.getElementById('jailed');
const bars = document.getElementById('bars');
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

const hideJail = () => {
    mainContainer.className = 'main-container hidden';
    bars.className = 'bars';
};

const jailUser = (user) => {
    hideJail();
    cooldownTimeout = setTimeout(() => {
        cooldownTimeout = undefined;
    },fieldData.cooldown * 1000);
    return new Promise((resolve) => {
        fetch(`https://decapi.me/twitch/avatar/${user}`)
            .then((data) => {
                data.text().then((img) => {
                    jailed.src = img;
                    mainContainer.className = 'main-container';
                    setTimeout(() => {
                        bars.className = 'bars animate';
                        sound.volume = fieldData.volume;
                        sound.play();
                        setTimeout(() => {
                            hideJail();
                        }, fieldData.howLongSeconds * 1000);
                    }, 1000);
                }).catch(() => {
                    resolve();
                });
            })
            .catch(() => {
                resolve();
            });
    });

};

let cooldownTimeout;

const handleMessage = (obj) => {
    const jailWords = (fieldData.jailWords || '').split(',');
    const {jailCommand, privileges} = fieldData;
    const data = obj.detail.event.data;
    const {text, displayName} = data;

    const bots = fieldData.botFilter.split(',');
    if(bots.find(b => b.trim().toLowerCase() === displayName.toLowerCase())){
        return;
    }

    if(cooldownTimeout){
        return;
    }

    if(text.startsWith(jailCommand) && checkPrivileges(data, privileges)){
        const userToJail = text.replace(jailCommand, '').replace('@', '').trim();
        jailUser(userToJail);
        return;
    }

    const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'').split(' ');
    const shouldGoToJail = words.some(word => jailWords.includes(word.toLowerCase()));
    if(!shouldGoToJail){

        return;
    }
    jailUser(displayName);
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

