let fieldData, apiToken;

const sayMessage = (message, messageVoice) => {
    const {volume, bannedWords} = fieldData;

    const bannedArray = (bannedWords || '').split(',').filter(w => !!w);
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

const checkPrivileges = (data, privileges) => {
    const {tags, userId} = data;
    const {mod, subscriber, badges} = tags;
    const required = privileges || fieldData.privileges;
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
const voices = ['Nicole', 'Russell', 'Raveena', 'Amy', 'Brian', 'Emma', 'Joanna', 'Matthew', 'Salli'];
let isEnabledForEverybody = false;
let everybodyTimeout = undefined;
let isEnabled = true;

const createEmoteRegex = (emotes) => {
    const regexStrings = emotes.sort().reverse().map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = `(?<=\\s|^)(?:${regexStrings.join('|')})(?=\\s|$|[.,!])`;
    return new RegExp(regex, 'g')
}

const htmlEncode  = (text) => text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`);
const processText = (text, emotes) => {
    const ignoreEmotes = fieldData.ignoreEmotes;
    if(!ignoreEmotes){
        return text;
    }
    const emoteRegex = createEmoteRegex(emotes.map(e => htmlEncode(e.name)))
    const textParts = text.split(emoteRegex);
    return textParts.join('');
};

const handleRaid = (obj) => {
    const { raidLimit } = fieldData;
    const {event} = obj?.detail || {};
    const name = event?.name;
    const amount = event?.amount;
    if(amount < raidLimit) {
        return;
    }
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

const handleEverybodyCommands = (obj) => {
    const {doEverybodyStuff, everybodyPrivileges, everybodyEnableCommand, everybodyDisableCommand, everybodyTime } = fieldData;
    const data = obj.detail.event.data;
    const {text} = data;
    if(!doEverybodyStuff){
        return false;
    }

    const messageIsEnable = text.toLowerCase().startsWith(everybodyEnableCommand.toLowerCase());
    const messageIsDisable = text.toLowerCase().startsWith(everybodyDisableCommand.toLowerCase());
    if((!messageIsEnable && !messageIsDisable) || !checkPrivileges(data, everybodyPrivileges)){
        return false;
    }
    if(messageIsEnable){
        isEnabledForEverybody = true;
        everybodyTimeout = setTimeout(() => {
            isEnabledForEverybody = false;
            clearTimeout(everybodyTimeout);
            everybodyTimeout = undefined;
        }, everybodyTime * 1000);
        return true;
    }
    isEnabledForEverybody = false;
    clearTimeout(everybodyTimeout);
    everybodyTimeout = undefined;
    return true;
};

const handleShutoffCommands = (obj) => {
    const {globalShutoffCommand, globalEnableCommand, globalShutOffPrivileges} = fieldData;
    const data = obj.detail.event.data;
    const {text} = data;

    const messageIsEnable = text.toLowerCase().startsWith(globalEnableCommand.toLowerCase());
    const messageIsDisable = text.toLowerCase().startsWith(globalShutoffCommand.toLowerCase());
    if((!messageIsEnable && !messageIsDisable) || !checkPrivileges(data, globalShutOffPrivileges)){
        return false;
    }
    if(messageIsEnable){
        isEnabled = true;
        return true;
    }
    isEnabled = false;
    return true;
};

const handleMessage = (obj) => {
    const {ttsCommand, voice, everybodyBotFilters, ignoreLinks, globalTTS} = fieldData;
    const data = obj.detail.event.data;
    const {text, userId, displayName, emotes} = data;

    const isEverybodyCommand = handleEverybodyCommands(obj);
    if(isEverybodyCommand){
        return;
    }

    const isShutoffCommand = handleShutoffCommands(obj);
    if(isShutoffCommand){
        return;
    }

    if(!isEnabled) {
        return;
    }

    const userVoice = voices[Number.parseInt(userId) % voices.length];

    const processedText = processText(text, emotes);
    const ignoreEmotes = fieldData.ignoreEmotes;
    const textToSay = ignoreEmotes ? processedText : text;
    const textHasLinks = textToSay.includes('http://') || textToSay.includes('https://') || textToSay.includes('.com') || textToSay.includes('.tv') || textToSay.includes('.net') || textToSay.includes('.org');
    if(ignoreLinks && textHasLinks){
        return;
    }

    if(isEnabledForEverybody || globalTTS) {
        if(text.startsWith('!')){
            return;
        }
        const bots = everybodyBotFilters.split(',');
        if(bots.find(b => b.toLowerCase() === displayName.toLowerCase())){
            return;
        }
        sayMessage(textToSay.toLowerCase().trim(), userVoice);
        return;
    }

    const activeRaiders = getActiveRaiders();
    if(activeRaiders.includes(displayName)) {
        sayMessage(textToSay.toLowerCase().trim(), userVoice);
        return;
    }
    const textStartsWithCommand = text.toLowerCase().startsWith(ttsCommand.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    sayMessage(textToSay.toLowerCase().replace(ttsCommand.toLowerCase(), '').trim(), voice);
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

