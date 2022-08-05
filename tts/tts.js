let fieldData, apiToken;

const sayMessage = (message, messageVoice) => {
    const {volume, bannedWords} = fieldData;

    const bannedArray = bannedWords.split(',');
    const sanitizedMessage = message.replace(/\W/g, '').toLowerCase();
    const messageHasBannedWords = bannedArray.some(word => sanitizedMessage.includes(word));
    if(messageHasBannedWords){
        return;
    }

    const url = `//api.streamelements.com/kappa/v2/speech?voice=${messageVoice.replace('$', '')}&text=${encodeURI(message)}&key=${apiToken}`
    const myAudio = new Audio(url);
    myAudio.volume = volume;
    myAudio.play();
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

const raids = [];
const voices = ['Nicole', 'Russel', 'Raveena', 'Amy', 'Brian', 'Emma', 'Joanna', 'Matthew', 'Salli'];

const handleRaid = (obj) => {
    const {event} = obj?.detail || {};
    const name = event?.name;
    raids.push({
        name,
        time: (new Date()).getTime(),
    });
};

const getActiveRaiders = () => {
    const {doRaidStuff, raidTime} = fieldData;
    if(!doRaidStuff){
        return [];
    }
    const now = new Date();
    return raids.filter(({time}) => now.getTime() - time < raidTime * 1000).map(({name}) => name);
};

const handleMessage = (obj) => {
    const {ttsCommand, voice} = fieldData;
    const data = obj.detail.event.data;
    const {text, userId, displayName} = data;
    const activeRaiders = getActiveRaiders();
    if(activeRaiders.includes(displayName)) {
        const raiderVoice = voices[Number.parseInt(userId) % voices.length];
        sayMessage(text.toLowerCase().trim(), raiderVoice);
    }
    const textStartsWithCommand = text.toLowerCase().startsWith(ttsCommand.toLowerCase())
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    sayMessage(text.toLowerCase().replace(ttsCommand.toLowerCase(), '').trim(), voice);
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message" && obj.detail.listener !== "raid-latest") {
        return;
    }
    if(obj.detail.listener === "raid-latest"){
        handleRaid(obj);
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    apiToken = obj.detail.channel.apiToken;
});

