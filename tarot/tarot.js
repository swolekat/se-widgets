let fieldData;

const listOfCards = [
    "aceOfCups",
    "aceOfPentacles",
    "aceOfSwords",
    "aceOfWands",
    "chariot",
    "death",
    "devil",
    "eightOfCups",
    "eightOfPentacles",
    "eightOfSwords",
    "eightOfWands",
    "emperor",
    "empress",
    "fiveOfCups",
    "fiveOfPentacles",
    "fiveOfSwords",
    "fiveOfWands",
    "fool",
    "fourOfCups",
    "fourOfPentacles",
    "fourOfSwords",
    "fourOfWands",
    "hangedMan",
    "hermit",
    "hierophant",
    "highPriestess",
    "judgement",
    "justice",
    "kingOfCups",
    "kingOfPentacles",
    "kingOfSwords",
    "kingOfWands",
    "knightOfCups",
    "knightOfPentacles",
    "knightOfSwords",
    "knightOfWands",
    "lovers",
    "magician",
    "moon",
    "nineOfCups",
    "nineOfPentacles",
    "nineOfSwords",
    "nineOfWands",
    "pageOfCups",
    "pageOfPentacles",
    "pageOfSwords",
    "pageOfWands",
    "queenOfCups",
    "queenOfPentacles",
    "queenOfSwords",
    "queenOfWands",
    "sevenOfCups",
    "sevenOfPentacles",
    "sevenOfSwords",
    "sevenOfWands",
    "sixOfCups",
    "sixOfPentacles",
    "sixOfSwords",
    "sixOfWands",
    "star",
    "strength",
    "sun",
    "temperance",
    "tenOfCups",
    "tenOfPentacles",
    "tenOfSwords",
    "tenOfWands",
    "threeOfCups",
    "threeOfPentacles",
    "threeOfSwords",
    "threeOfWands",
    "tower",
    "twoOfCups",
    "twoOfPentacles",
    "twoOfSwords",
    "twoOfWands",
    "wheelOfFortune",
    "world",
];
let currentCardIndex = 0;

const mainContainer = document.getElementById('main-container');
const card1 = document.getElementById('card1');
const card2 = document.getElementById('card2');
const card3 = document.getElementById('card3');
const cardElements = [card1, card2, card3];
const cardWrapper1 = document.getElementById('cardWrapper1');
const cardWrapper3 = document.getElementById('cardWrapper3');
const cardWrapper2 = document.getElementById('cardWrapper2');
const cardWrappers = [cardWrapper1, cardWrapper3, cardWrapper2];


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

const getIsReversed = () => {
    const rando = Math.round(Math.random() * 1000) %2;
    return rando === 1 ? 'reversed' : '';
};

const drawThree = () => {
    const numberOfCards = listOfCards.length;
    const cardIndexes = [];
    while(cardIndexes.length <3) {
        const randomIndex = Math.round(Math.random() * 1000) % numberOfCards;
        if(!cardIndexes.includes(randomIndex)){
            cardIndexes.push(randomIndex);
        }
    }
    cardIndexes.forEach((cardIndex, index) => {
        const element = cardElements[index];
        element.src = `https://swolekat.github.io/se-widgets/assets/tarot/${listOfCards[cardIndex]}.jpg`;
        element.className = `card ${getIsReversed()}`;
        const wrapperElement = cardWrappers[index];
        wrapperElement.className = 'card-wrapper';
    });
};

const showCard = (cardToShow) => {
    const cardParts = cardToShow.split(' ');
    const element = cardElements[currentCardIndex];
    element.src = `https://swolekat.github.io/se-widgets/assets/tarot/${cardParts[0]}.jpg`;
    element.className = `card ${cardParts.length > 1 ? 'reversed' : ''}`
    const wrapperElement = cardWrappers[currentCardIndex];
    wrapperElement.className = 'card-wrapper';
    currentCardIndex = (currentCardIndex + 1) % cardElements.length;
};

const hide = () => {
    currentCardIndex = 0;
    cardWrapper1.className = 'card-wrapper hidden';
    cardWrapper2.className = 'card-wrapper hidden';
    cardWrapper3.className = 'card-wrapper hidden';
};

const handleMessage = (obj) => {
    const {drawThreeCommand, showCommand, hideCommand} = fieldData;
    const data = obj.detail.event.data;
    if (!checkPrivileges(data)) {
        return;
    }

    const {text} = data;
    const isDrawThree = text.toLowerCase().startsWith(drawThreeCommand.toLowerCase());
    if (isDrawThree) {
        drawThree();
        return;
    }

    const show = text.toLowerCase().startsWith(showCommand.toLowerCase());
    if (show) {
        showCard(text.replace(showCommand, '').trim());
        return;
    }

    const shouldHide = text.toLowerCase().startsWith(hideCommand.toLowerCase());
    if (shouldHide) {
        hide();
        return;
    }
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    if (fieldData.preview) {
        // show all cards here
        cardWrappers.className = 'card-wrapper';
        cardWrappers.className = 'card-wrapper';
        cardWrappers.className = 'card-wrapper';
    }
});

