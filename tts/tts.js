let fieldData, apiToken;

let isPlaying = false;
let queue = [];
const sayMassagedMessage = (fullMessage, messageVoice) => {
    if(!fullMessage.trim()){
        return;
    }
    isPlaying = true;
    const volume = fieldData.volume;
    const url = `//api.streamelements.com/kappa/v2/speech?voice=${messageVoice.replace('$', '')}&text=${encodeURI(fullMessage)}&key=${apiToken}`
    const myAudio = new Audio(url);
    myAudio.volume = volume;
    myAudio.addEventListener('ended', () => {
        if(queue.length > 0){
            const nextMessage = queue.pop();
            sayMassagedMessage(nextMessage.fullMessage, nextMessage.messageVoice);
        } else {
            isPlaying = false;
        }
    });
    try {
        const playPromise = myAudio.play();
        if(!playPromise){
            return;
        }
        playPromise.then(() => {
            console.log('playing message');
        }).catch(e => console.log(e));
    } catch(e) {
        console.log(e);
    }
};

const sayMessage = (message, messageVoice, userDisplayName) => {
    const {bannedWords, doUserSaid, characterLimit, useQueue, ignoreRepeats} = fieldData;
    if(ignoreRepeats){
        const hasRepeats = `${message}${message}`.indexOf(message, 1) !== message.length;
        if(hasRepeats){
            return;
        }
    }

    const bannedArray = (bannedWords || '').split(',').filter(w => !!w);
    const sanitizedMessage = message.replace(/\W/g, '').toLowerCase();
    const messageHasBannedWords = bannedArray.some(word => sanitizedMessage.includes(word));
    if(messageHasBannedWords){
        return;
    }

    let fullMessage = message;
    if(doUserSaid){
        fullMessage = `${userDisplayName} says ${message}`
    }
    if(characterLimit > 0){
        fullMessage = fullMessage.substr(0, characterLimit);
    }


    if(useQueue && isPlaying){
        queue.unshift({fullMessage, messageVoice});
        return;
    }
    sayMassagedMessage(fullMessage, messageVoice);
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

const raids = [];
const defaultPerUserVoices = ['Nicole', 'Russell', 'Raveena', 'Amy', 'Brian', 'Emma', 'Joanna', 'Matthew', 'Salli'];
let isEnabledForEverybody = false;
let everybodyTimeout = undefined;
let isEnabled = true

const createEmoteRegex = (emotes) => {
    const regexStrings = emotes.sort().reverse().map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = `(?<=\\s|^)(?:${regexStrings.join('|')})(?=\\s|$|[.,!])`;
    return new RegExp(regex, 'g')
}

const htmlEncode  = (text) => text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`);
const processText = (text, emotes) => {
    let processedText = text;
    const { ignoreEmotes, ignoreEmojis } = fieldData;
    if(ignoreEmotes){
        const emoteRegex = createEmoteRegex(emotes.map(e => htmlEncode(e.name)))
        const textParts = text.split(emoteRegex);
        processedText = textParts.join('');
    }
    if(ignoreEmojis){
        processedText = processedText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    }
    processedText = processedText.replace(/#/g, ' hash tag ');
    return processedText.trim();
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
        if(everybodyTime > 0){
            everybodyTimeout = setTimeout(() => {
                isEnabledForEverybody = false;
                clearTimeout(everybodyTimeout);
                everybodyTimeout = undefined;
            }, everybodyTime * 1000);
        }
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
    const {ttsCommands, voice, everybodyBotFilters, ignoreLinks, globalTTS, globalTTSPrivileges, perUserVoices, idToVoiceMap} = fieldData;
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
    let userVoices = perUserVoices.split(',').map(v => v.trim()).filter(v => !!v);
    if(userVoices.length === 0){
        userVoices = defaultPerUserVoices;
    }

    let realIdtoVoiceMap = {};
    try {
        realIdtoVoiceMap = JSON.parse(idToVoiceMap) || {};
    }
    catch (e) {
        console.log(e);
    }

    const userVoice = realIdtoVoiceMap[userId] || userVoices[Number.parseInt(userId) % userVoices.length];

    const processedText = processText(text, emotes);
    const textToSay = processedText;
    const textHasLinks = textToSay.includes('http://') || textToSay.includes('https://') || textToSay.includes('.com') || textToSay.includes('.tv') || textToSay.includes('.net') || textToSay.includes('.org');
    if((ignoreLinks && textHasLinks) || !processedText){
        return;
    }

    if(isEnabledForEverybody || globalTTS) {
        if(text.startsWith('!')){
            return;
        }
        if(everybodyBotFilters.toLowerCase().includes(displayName.toLowerCase())){
            return;
        }
        if(globalTTS && !checkPrivileges(data, globalTTSPrivileges)){
            return;
        }
        sayMessage(textToSay.toLowerCase().trim(), userVoice, displayName);
        return;
    }

    const activeRaiders = getActiveRaiders();
    if(activeRaiders.includes(displayName)) {
        sayMessage(textToSay.toLowerCase().trim(), userVoice, displayName);
        return;
    }
    if(ttsCommands === ''){
        return;
    }
    const realCommands = ttsCommands.split(',').filter(s => !!s).map(s => s.trim());
    const commandThatMatches = realCommands.find(command => text.toLowerCase().startsWith(command.toLowerCase()));
    if (!commandThatMatches || !checkPrivileges(data)) {
        return;
    }

    sayMessage(textToSay.toLowerCase().replace(commandThatMatches.toLowerCase(), '').trim(), voice, displayName);
};

window.addEventListener('onEventReceived', function (obj) {
    if(!fieldData){
        return;
    }
    if (obj.detail.listener !== "message" && obj.detail.listener !== "raid-latest") {
        return;
    }
    if(obj.detail.listener === "raid-latest"){
        handleRaid(obj);
        return;
    }
    try {
        handleMessage(obj);
    } catch (e) {
        console.log(e);
    }
});

window.addEventListener('onWidgetLoad', function (obj) {
    // apparently sometimes the widget reloads and this resets the value.
    if(!obj.detail.fieldData){
        return;
    }
    fieldData = obj.detail.fieldData;
    apiToken = obj.detail.channel.apiToken;
});

