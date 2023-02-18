let fieldData;

const bonkQueue = [];
let isBonking = false;

const mainContainer = document.getElementById('main-container');
const bonkee = document.getElementById('bonkee');
const bat = document.getElementById('bat');
const sound = document.getElementById('sound');

const bonkUser = (user) => {
    return new Promise((resolve) => {
        fetch(`https://decapi.me/twitch/avatar/${user}`)
            .then((data) => {
                data.text().then((img) => {
                    bonkee.src = img;
                    mainContainer.className = 'main-container';
                    setTimeout(() => {
                        bat.className = 'bonk animate';
                        sound.play();
                        setTimeout(() => {
                            bonkee.className = 'bonkee animate';
                            setTimeout(() => {
                                mainContainer.className = 'main-container hidden';
                                bat.className = 'bonk';
                                bonkee.className = 'bonkee';
                                resolve();
                            }, 1000);

                        }, 500);
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

const bonk = async () => {
    if(isBonking){
        return;
    }
    isBonking = true;

    while(bonkQueue.length > 0){
        const queueUser = bonkQueue.shift();
        await bonkUser(queueUser);
    }
    isBonking = false;
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
    const bonkCommand = fieldData.bonkCommand;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(bonkCommand.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    const userToBonk = text.toLowerCase().replace(bonkCommand.toLowerCase(), '').trim();
    bonkQueue.push(userToBonk);
    bonk();
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

