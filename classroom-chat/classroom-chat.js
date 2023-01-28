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
];

const convertMessageContentsArrayToHtml = (messageContentsArray, emoteSize) => {
    const parsedElements = [];

    messageContentsArray.forEach(({data, type}, index) => {
        if(type !== 'emote'){
            parsedElements.push(`<span class="text">${data}</span>`);
            return;
        }
        if(isEmoteZeroWidth(data.name) && data.rendered){
            return;
        }
        let nextElementIndex = index + 1;
        let nextElement = messageContentsArray[nextElementIndex];
        const children = [];
        while(nextElementIndex <= messageContentsArray.length - 1 && (nextElement && nextElement.type === 'emote' && isEmoteZeroWidth(nextElement.data.name))){
            children.push(nextElement.data);
            nextElement.data.rendered = true;
            nextElementIndex++;
            nextElement = messageContentsArray[nextElementIndex];
        }
        const mainEmote = `<img src="${getUrlFromEmoteSizeAndData(data, emoteSize)}" class="emote" />`;
        if(children.length === 0){
            parsedElements.push(mainEmote)
            return;
        }
        parsedElements.push(`
            <div class="complex-emote">
                ${mainEmote}
                ${children.map(src => `<img src="${getUrlFromEmoteSizeAndData(src, emoteSize)}" class="emote zero-width" />`).join('\n')}
            </div>
        `);
    });
    return parsedElements.join('\n');
};

const isColorLight = (color) => {
    const parsedColor = +("0x" + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));
    const r = parsedColor >> 16;
    const g = parsedColor >> 8 & 255;
    const b = parsedColor & 255;
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 127.5;
}

const createMessageHtml = ({
                               badges, userId, displayName, messageContentsArray, msgId, color, emoteSize,
                           }) => {

    const badgeHtml = badges.map(badge => `<img class="badge" src="${badge.url}" />`).join('\n');

    // don't mess with data-message-id, data-user-id or the chat-message class name
    return `
        <div data-message-id="${msgId}" data-user-id="${userId}" class="chat-message ${emoteSize}" >
            <div class="username-section ${isColorLight(color) ? '' : 'white-text'}" style="background: ${color}">
                ${badgeHtml}
                ${displayName}
            </div>
            <div class="message-section">
                <span class="message-wrapper">
                    ${convertMessageContentsArrayToHtml(messageContentsArray, emoteSize)}
                </span>
            </div>
        </div>
    `;
};

// stop customization here unless you know what you're doing fr fr ong
// these are the guts

/* Widget Initalization */
const data = {};
const MAX_MESSAGES = 50;
let messages = [];
let lastRenderedMessageId = '';

window.addEventListener('onWidgetLoad', async obj => {
    processSessionData(obj.detail.session.data);
    processFieldData(obj.detail.fieldData);
})

const processSessionData = (sessionData) => {
    const latestFollower = sessionData['follower-latest']?.name;
    if (latestFollower) {
        data.latestFollower = latestFollower;
    }
    const latestSubscriber = sessionData['subscriber-latest']?.name;
    if (latestSubscriber) {
        data.latestSubscriber = latestSubscriber;
    }
    const latestCheerer = sessionData['cheer-latest']?.name;
    if (latestCheerer.length) {
        data.latestCheerer = latestCheerer;
    }
    const latestRaider = sessionData['raid-latest']?.name;
    if (latestRaider) {
        data.latestRaider = latestRaider;
    }
};

const processFieldData = (fieldData) => {
    data.largeEmotes = fieldData.largeEmotes === 'true';
    data.ignoreUserList = fieldData.ignoreUserList.split(',');
    data.ignorePrefixList = fieldData.ignorePrefixList.split(',');
    data.lifetime = fieldData.lifetime;
    data.numberOfChats = fieldData.numberOfChats;
    data.chatOffset = fieldData.chatOffset;
};

/* message handling */

const shouldNotShowMessage = ({text, name ,nick}) => {
    if(data.ignorePrefixList.some(prefix => text.startsWith(prefix))){
        return true;
    }
    const names = [name.toLowerCase() , nick.toLowerCase()];
    if(data.ignoreUserList.some(user => names.includes(user.toLowerCase()))){
        return true;
    }
    return false;
};

const htmlEncode  = (text) => text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`);
const createEmoteRegex = (emotes) => {
    const regexStrings = emotes.sort().reverse().map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = `(?<=\\s|^)(?:${regexStrings.join('|')})(?=\\s|$|[.,!])`;
    return new RegExp(regex, 'g')
}

const processMessageText = (text, emotes) => {
    if (!emotes || emotes.length === 0) {
        return [{ type: 'text', data: text }];
    }

    const emoteRegex = createEmoteRegex(emotes.map(e => htmlEncode(e.name)))

    const textObjects = text.split(emoteRegex).map(string => ({ type: 'text', data: string }));
    const lastTextObject = textObjects.pop();

    const parsedText = textObjects.reduce((acc, textObj, index) => {
        return [...acc, textObj, { type: 'emote', data: emotes[index] }]
    }, []);

    parsedText.push(lastTextObject);
    return parsedText.filter(({data, type}) => type === 'emote' || !!data.trim());
};

const isEmoteZeroWidth = (emoteText) =>  ZERO_WIDTH_EMOTES.includes(emoteText);

const calcEmoteSize = (messageContentsArray) => {
    const hasText = messageContentsArray.filter(({type}) => type !== 'emote').length > 0;
    if(hasText){
        return 'small-emotes';
    }
    const allEmotes = messageContentsArray.filter(({type}) => type === 'emote');
    const nonZeroWidthEmotes = allEmotes.filter(({data}) => !isEmoteZeroWidth(data?.name));
    const numberOfEmotes = nonZeroWidthEmotes.length;
    return numberOfEmotes === 1 ? 'large-emotes' : 'medium-emotes';
}
const getUrlFromEmoteSizeAndData = (data, emoteSize) => {
    if(emoteSize === 'large-emotes'){
        return data.urls["4"];
    }
    if(emoteSize === 'medium-emotes'){
        return data.urls["2"];
    }
    return data.urls["1"];
};

const showMessage = (msgId, html) => {
    const messageElementId = `.chat-message[data-message-id="${msgId}"]`;
    document.getElementById('main').innerHTML = html;

    // must do the delay to calculate the dynamic width
    setTimeout(() => {
        const maxWidth = $(`${messageElementId} .message-wrapper`).width() + 1;
        const minWidth = $(`${messageElementId} .username-section`).outerWidth();

        $(`${messageElementId}`).css({
            '--dynamicWidth': Math.max(minWidth, maxWidth),
        });

        $(messageElementId).addClass('animate');
        if(data.lifetime === 0){
            $(messageElementId).addClass('forever');
            return;
        }
        if (data.lifetime > 0) {
            window.setTimeout(_ => {
                $(messageElementId).addClass('hide');
            }, data.lifetime * 1000 )
        }
    }, 1000);
};

const altColors = [
    '#FF4A80', '#FF7070', '#FA8E4B', '#FEE440',
    '#5FFF77', '#00F5D4', '#00BBF9', '#4371FB',
    '#9B5DE5', '#F670DD',
];

const getColorBasedOnId = (userId) => {
    const number = Number.parseInt(userId, 10);
    return altColors[number % altColors.length];
};

const renderMessage = () => {
    const messagesWithOffset = messages.filter((m) => m.messageIndex % data.numberOfChats === data.chatOffset);
    const messageToRender = messagesWithOffset[messagesWithOffset.length -1];
    if(!messageToRender){
        return;
    }
    if(messageToRender.msgId === lastRenderedMessageId){
        return;
    }
    lastRenderedMessageId = messageToRender.msgId;
    let {
        badges = [],
        userId = '',
        displayName = '',
        emotes = [],
        text = '',
        msgId = '',
        displayColor: color
    } = messageToRender;
    if(!color){
        color = getColorBasedOnId(userId);
    }

    const messageContentsArray = processMessageText(htmlEncode(text), emotes);
    const emoteSize = calcEmoteSize(messageContentsArray);
    const eventClasses = '';

    const html = createMessageHtml({
        badges, userId, displayName, messageContentsArray, msgId, color, emoteSize, eventClasses
    });

    showMessage(msgId, html);
};

const cleanUpMessages = () => {
    const messageThreshold = (MAX_MESSAGES + data.numberOfChats);
    if(messages.length <= messageThreshold){
        return;
    }
    const messagesToRemove = data.numberOfChats ;
    for(let x = 0; x < messagesToRemove; x++){
        messages.shift();
    }
};

let messageIndex = 0;

const onMessage = (event) => {
    const {nick = '', name = '', text = '', msgId} = event.data;

    if(shouldNotShowMessage({text, name, nick})){
        return;
    }

    messages.push({
        ...event.data,
        messageIndex,
    });
    messageIndex +=1;
    renderMessage();
    cleanUpMessages();
};

/* other events */

const onDeleteMessage = (event) => {
    if(!event.msgId){
        return;
    }
    messages = messages.filter(m => m.msgId !== event.msgId);
    renderMessage();
};

const onDeleteMessages = (event) => {
    if(!event.userId){
        return;
    }
    messages = messages.filter(m => m.userId !== event.userId);
    renderMessage();
};

/* Use Events */
const eventListenerToHandlerMap = {
    message: onMessage,
    'delete-message': onDeleteMessage,
    'delete-messages': onDeleteMessages,
};

window.addEventListener('onEventReceived', obj => {
    const {listener, event} = obj?.detail || {};
    const handler = eventListenerToHandlerMap[listener];
    if (!handler) {
        return;
    }
    handler(event);
})