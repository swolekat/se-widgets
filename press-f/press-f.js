let fieldData;

const mainContainer = document.getElementById('main-container');
const roses = document.getElementById('roses');

let isThrowing = false;
let isThrowingTimeout;

const hide = () => {
    mainContainer.className = 'main-container hidden';
    roses.innerHTML = '';
};

const show = () => {
    mainContainer.className = 'main-container';
};

const createRose = () => {
    const height = Math.round(Math.random() * 300) + 100;
    const width = Math.round(Math.random() * 300) + 100;
    const rose = document.createElement('div');
    rose.className = 'rose';
    rose.style.height = `${height}px`;
    rose.style.width = `${width}px`;

    return rose;
};

const throwRose = () => {
    const roseItem = createRose();

    const {height, width} = mainContainer.getBoundingClientRect();
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const isLeft = Math.round(Math.random() * 1000) % 2 === 0;
    const startingY = Math.round(Math.random() * halfHeight) + halfHeight;
    const startingX = isLeft ? -200 : width + 200;
    roseItem.style.transform = `rotate(${isLeft ? '90deg' : '-90deg'}`;
    roseItem.style.top = `${height - startingY}px`;
    roseItem.style.left = `${startingX}px`;
    roses.appendChild(roseItem);

    const endingHeightBase = 100;
    let endingX = Math.round(Math.random() * halfWidth);
    if(isLeft){
        endingX += halfWidth;
    }
    const endingY = endingHeightBase + Math.round(Math.random() * 100);


    setTimeout(() => {
        roseItem.style.top = `${height - (startingY * 1.4)}px`;
        roseItem.style.left = `${isLeft ? (endingX - startingX) / 3 : (startingX - endingX) / 3}px`;
        setTimeout(() => {
            roseItem.className = 'rose out';
            setTimeout(() => {
                roseItem.style.top = `${height - endingY}px`;
                roseItem.style.left = `${endingX}px`;
            }, 100);
        }, 2000);
    }, 100);
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
    const { command, duration } = fieldData;
    const data = obj.detail.event.data;
    const {text} = data;
    if(isThrowing && text.toLowerCase() === 'f'){
        throwRose();
    }
    const textStartsWithCommand = text.toLowerCase().startsWith(command.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }
    isThrowing = true;
    if(isThrowingTimeout){
        clearTimeout(isThrowingTimeout);
    }
    isThrowingTimeout = setTimeout(() => {
        isThrowing = false;
        hide();
    }, duration * 1000);
    show();
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

