let fieldData;

const patQueue = [];
let isPetting = false;

const mainContainer = document.getElementById('main-container');
const patee = document.getElementById('patee');
const sound = document.getElementById('sound');

const patUser = (user) => {
    return new Promise((resolve) => {
        fetch(`https://decapi.me/twitch/avatar/${user}`)
            .then((data) => {
                data.text().then((img) => {
                    patee.src = img;
                    mainContainer.className = 'main-container';
                    setTimeout(() => {
                        sound.play();
                        setTimeout(() => {
                            mainContainer.className = 'main-container hidden';
                            resolve();
                        }, 1500);
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

const pat = async () => {
    if(isPetting){
        return;
    }
    isPetting = true;

    while(patQueue.length > 0){
        const queueUser = patQueue.shift();
        await patUser(queueUser);
    }
    isPetting = false;
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
    const { patCommand } = fieldData;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(patCommand.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    const userToPat = text.toLowerCase().replace(patCommand.toLowerCase(), '').trim();
    patQueue.push(userToPat);
    pat();
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

