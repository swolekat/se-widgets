let fieldData;

const mainContainer = document.getElementById('main-container');
const image = document.getElementById('image');



const section = document.querySelector("section");
const logo = document.querySelector(".logo");
const FPS = 60;


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

const start = () => {
    show();
    setTimeout(() => {
        let xPosition = Math.round(Math.random() * 40);
        let yPosition = Math.round(Math.random() * 40);
        let xSpeed = {xSpeed};
        let ySpeed = {ySpeed};
        changeColor();
        updatePosition(xPosition, yPosition);
        let bounceInterval = setInterval(() => {
            const xLessOrAtZero = xPosition <= 0;
            const xPastBounds = xPosition + image.clientWidth >= window.innerWidth;
            const yLessOrAtZero = yPosition <= 0;
            const yPastBounds = yPosition + image.clientHeight >= window.innerHeight;

            const topLetCorner = xLessOrAtZero && yLessOrAtZero;
            const bottomLeftCorner = xLessOrAtZero && yPastBounds;
            const topRightCorner = xPastBounds && yLessOrAtZero;
            const bottomRightCorner = xPastBounds && yPastBounds;
            if(topLetCorner || topRightCorner || bottomRightCorner || bottomLeftCorner) {
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
    }, 0);
};

const handleMessage = (obj) => {
    const command = fieldData.command;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(command.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }
    start();
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

