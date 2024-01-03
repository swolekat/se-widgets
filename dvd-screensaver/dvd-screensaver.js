let fieldData;

const mainContainer = document.getElementById('main-container');
const image = document.getElementById('image');



const logo = document.querySelector(".logo");

// Logo moving velocity Variables

function update() {
    logo.style.left = xPosition + "px";
    logo.style.top = yPosition + "px";
}



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

const show = () => {
    mainContainer.className = 'main-container';
};

const hide = () => {
    mainContainer.className = 'main-container hidden';
};

const changeColor = () => {
    const newColor = Math.round(Math.random() * 359);
    image.style.filter = `sepia(100%) saturate(300%) brightness(70%) hue-rotate(${newColor}deg)`
};

const updatePosition = (x, y) => {
    image.style.left = `${x}px`;
    image.style.top = `${y}px`;
};

let bounceInterval;
let id = 0;

const start = (emoteUrl) => {
    if(bounceInterval){
        clearInterval(bounceInterval);
    }
    image.src = emoteUrl;
    show();
    setTimeout(() => {
        const myId = id + 1;
        id = myId;
        let xPosition = Math.round(Math.random() * 40);
        let yPosition = Math.round(Math.random() * 40);
        let xSpeed = {xSpeed};
        let ySpeed = {ySpeed};
        changeColor();
        updatePosition(xPosition, yPosition);
        bounceInterval = setInterval(() => {
            if(id !== myId){
                return;
            }
            const xLessOrAtZero = xPosition <= 0;
            const xPastBounds = xPosition + image.clientWidth >= window.innerWidth;
            const yLessOrAtZero = yPosition <= 0;
            const yPastBounds = yPosition + image.clientHeight >= window.innerHeight;

            const topLetCorner = xLessOrAtZero && yLessOrAtZero;
            const bottomLeftCorner = xLessOrAtZero && yPastBounds;
            const topRightCorner = xPastBounds && yLessOrAtZero;
            const bottomRightCorner = xPastBounds && yPastBounds;
            if(!fieldData.dontDisappear && (topLetCorner || topRightCorner || bottomRightCorner || bottomLeftCorner)) {
                clearInterval(bounceInterval);
                hide();
                return;
            }

            if (xLessOrAtZero || xPastBounds) {
                xSpeed = -xSpeed;
                changeColor();
            }
            if (yLessOrAtZero || yPastBounds) {
                ySpeed = -ySpeed;
                changeColor();
            }

            xPosition += xSpeed;
            yPosition += ySpeed;

            updatePosition(xPosition, yPosition)
        }, 1000 / 60);
    }, 100);
};

let cooldownTimeout;

const handleMessage = (obj) => {
    if(cooldownTimeout){
        return;
    }
    const command = fieldData.command;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(command.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }
    let emoteUrl = fieldData.imageUrl;
    if(data.emotes.length > 0){
        const emotes = Object.values(data.emotes[0].urls);
        emoteUrl = emotes[emotes.length -1];
    }
    start(emoteUrl);
    cooldownTimeout = setTimeout(() => {
        cooldownTimeout = undefined;
    }, fieldData.cooldown * 1000);
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    setTimeout(() => {
        if(fieldData.startOn){
            start(fieldData.imageUrl);
        }
    }, 0);
});

