let fieldData, apiToken;

const captionTextElement = document.getElementById('caption-text');

let isSpeakingMessage = false;
const queuedMessages = [];

const sayMessage = (message) => {
    const {volume, bannedWords, voice} = fieldData;

    const bannedArray = (bannedWords || '').split(',').filter(w => !!w);
    const sanitizedMessage = message.replace(/\W/g, '').toLowerCase();
    const messageHasBannedWords = bannedArray.some(word => sanitizedMessage.includes(word));
    if(messageHasBannedWords){
        return;
    }

    if(isSpeakingMessage){
        queuedMessages.push(message);
    }

    isSpeakingMessage = true;


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
                isSpeakingMessage = false;
                if(queuedMessages.length > 0){
                    sayMessage(queuedMessages.pop());
                }
                return;
            }
            const myAudio = new Audio();
            myAudio.src = `data:audio/mp3;base64,${data}`;
            myAudio.volume = volume;
            myAudio.play();
            captionTextElement.innerHTML = message;
            captionTextElement.style = `color: ${fieldData.fontColor}`;
            setTimeout(() => {
                captionTextElement.innerHTML = '';
                isSpeakingMessage = false;
                if(queuedMessages.length > 0){
                    sayMessage(queuedMessages.pop());
                }
            }, 10000);
        });
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
    const {ttsCommand, voice} = fieldData;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(ttsCommand.toLowerCase())
    if (!textStartsWithCommand || !checkPrivileges(data)) {
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

