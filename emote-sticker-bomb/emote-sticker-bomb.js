// add ones that you add on 7tv here
const ZERO_WIDTH_EMOTES = [
    'SnowTime',
    'RainTime',
    'PETPET',
    'SteerR',
    'Wave',
    'ricardo',
    'SpongebobWindow',
    'pepehhoodie',
    'BlowKiss',
    'gunsOut',
    'Tex',
    'AYAYAHair',
    'SweatTime',
    'binoculars',
    'Pick',
    'Partyhat',
    'GunPoint',
    'LunchTime',
    '7Salute',
    'KAREN',
    'SPEED',
    'WEEB',
    'DUM',
    'ShowerTime',
    'MathTime',
    'DoesntKnow',
    'BONK',
    'MoneyRain',
    'ShyTime',
    'Rage',
    'WICKEDglasses',
    'HACKS',
    'vp',
    'Fire',
    'TakingNotes',
    'Love',
    'SPEED',
    'vp',
    'Wanking',
    'spilledGlue'
];

let fieldData;

const mainContainer = document.getElementById('main-container');

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


const addSticker = (emoteStack) => {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const rotation = Math.random() * 360;
    const content = `
        <div class="sticker-content">
            ${emoteStack.map((emote, index) => `<img src='${emote.urls[4]}' class="emote ${index > 0 ? 'zero-width' : ''}" >`).join('')}
        </div>
    `;
    const element = document.createElement('div');
    element.className = 'sticker';
    element.style.top = `${y}%`;
    element.style.left = `${x}%`;
    element.style.transform = `rotate(${rotation}deg`;
    element.innerHTML = content;
    mainContainer.appendChild(element);
};

const getStacksFromEmotes = (emotes) => {
    const emoteStacks = [];
    emotes.forEach((emote, index) => {
        if (ZERO_WIDTH_EMOTES.includes(emote.name)) {
            return;
        }
        const currentStack = [emote];
        let nextIndex = index + 1;
        let nextEmote = emotes[nextIndex];
        while(nextEmote !== undefined && ZERO_WIDTH_EMOTES.includes(nextEmote.name)){
            currentStack.push(nextEmote);
            nextIndex +=1;
            nextEmote = emotes[nextIndex];
        }
        emoteStacks.push(currentStack);
    });

    return emoteStacks;
};

const handleMessage = (obj) => {
    const data = obj.detail.event.data;
    const {emotes} = data;
    if (!checkPrivileges(data)) {
        return;
    }
    const emoteStacks = getStacksFromEmotes(emotes);
    emoteStacks.forEach(stack => {
        addSticker(stack);
    });
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

