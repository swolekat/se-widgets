let fieldData, apiToken;

const voices = [
    'en_female_f08_warmy_breeze',
    'en_female_f08_salut_damour',
    'en_female_ht_f08_glorious',
    'en_female_ht_f08_wonderful_world',
];

let isOnCooldown = false;

const sayMessage = (message) => {
    const {volume, bannedWords} = fieldData;

    const bannedArray = (bannedWords || '').split(',').filter(w => !!w);
    const sanitizedMessage = message.replace(/\W/g, '').toLowerCase();
    const messageHasBannedWords = bannedArray.some(word => sanitizedMessage.includes(word));
    if(messageHasBannedWords){
        return;
    }

    const voice = voices[Math.round(Math.random() * 1000) % voices.length];

    fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
        method: 'POST',
        body: JSON.stringify({
            text: message.substr(0, 300),
            voice
        }),
        headers: {
            "Content-type": "application/json"
        }
    }).then(response => response.json())
        .then(({data}) => {
            if(!data){
                return;
            }
            const myAudio = new Audio();
            myAudio.src = `data:audio/mp3;base64,${data}`;
            myAudio.volume = volume;
            myAudio.play();
        });
    const cooldownSeconds = fieldData.cooldownSeconds;
    if(cooldownSeconds > 0){
        isOnCooldown = true;
        setTimeout(() => {
            isOnCooldown = false;
        }, cooldownSeconds * 1000);
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
    const ttsCommand = fieldData.ttsCommand;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(ttsCommand.toLowerCase())
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    if(isOnCooldown){
        return;
    }
    sayMessage(text.toLowerCase().replace(ttsCommand.toLowerCase(), '').trim());
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    apiToken = obj.detail.channel.apiToken;
});

