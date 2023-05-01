let fieldData;

const marker = document.getElementById('marker');
const LEFT_PADDING = 14;
const TOP_PADDING = 11;
const BOTTOM_PADDING = 6;
const MARKER_RADIUS = 1.5;

// these should be from -100 to 100;
let hype = 0;
let positive = 0;

const shouldIgnoreUser = ({text, name, nick}) => {
    if (fieldData.ignorePrefixList.split(',').some(prefix => text.startsWith(prefix))) {
        return true;
    }
    const names = [name.toLowerCase(), nick.toLowerCase()];
    if (fieldData.ignoreUserList.split(',').some(user => names.includes(user.toLowerCase()))) {
        return true;
    }
    return false;
};

const hypeFromCaps = (text) => {
    const allCaps = text.replace(/[^A-Z]+/g, "");
    const percentageCaps = allCaps.length / text.length;
    if (percentageCaps >= .75) {
        return 2;
    }
    if (percentageCaps >= .5) {
        return 1;
    }
    if (percentageCaps >= .25) {
        return 0;
    }
    return -1;
};

const hypeFromEmotes = (text, emotes) => {
    let textWithoutEmotes = text;
    emotes.forEach(emote => {
        textWithoutEmotes = textWithoutEmotes.split(emote.name).join('');
    });

    const percentageEmotes = 1 - (textWithoutEmotes.length / text.length);
    if (percentageEmotes >= .75) {
        return 2;
    }
    if (percentageEmotes >= .5) {
        return 1;
    }
    if (percentageEmotes >= .25) {
        return 0;
    }
    return -1;
};

const positiveModifierFromText = (text) => {
    const result = empath.default.analyseSentiment(text);
    const score = result.score;
    if (score > 5) {
        return 5;
    }
    if (score < -5) {
        return -5;
    }
   return score;
};

const handleMessage = ({text, emotes}) => {
    const hypeModifier = Math.max(hypeFromCaps(text), hypeFromEmotes(text, emotes));
    const positiveModifier = positiveModifierFromText(text);
    hype += hypeModifier;
    positive += positiveModifier;
    hype = Math.max(Math.min(hype, 100), -100);
    positive = Math.max(Math.min(positive, 100), -100);
    updateChart();
};


const updateChart = () => {
    const adjustedHype = hype + 100;
    const adjustedPositive = positive + 100;
    const percentageHype = 1 - adjustedHype / 200; // 0 should be bottom left not top left
    const percentagePositive = adjustedPositive / 200;
    const realXPercentage = (100 - LEFT_PADDING) * percentagePositive + LEFT_PADDING - MARKER_RADIUS;
    const realYPercentage = (100 - TOP_PADDING - BOTTOM_PADDING) * percentageHype + TOP_PADDING - MARKER_RADIUS;
    marker.style.left = `${realXPercentage}%`;
    marker.style.top = `${realYPercentage}%`;
};

const onMessage = (event) => {
    const {nick = '', name = '', text = '', emotes} = event.data;
    const {command, privileges} = fieldData;

    if (shouldIgnoreUser({text, name, nick})) {
        return;
    }
    handleMessage({text, emotes});
};

window.addEventListener('onEventReceived', obj => {
    const {listener, event} = obj?.detail || {};
    if (listener !== 'message') {
        return;
    }
    onMessage(event);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    updateChart();
});
