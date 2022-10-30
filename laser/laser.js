let fieldData;

const mainContainer = document.getElementById('main-container');
const pointerCore = document.getElementById('pointer-core');

const numberOfSegments = 15;
let destination = [0, 0];
let endTimeout = undefined;
let laserUpdateInterval = undefined;
let positions = [];
let velocity = 0;

const getRandomPoint = () => {
    const {width, height} = mainContainer.getBoundingClientRect();
    return [Math.round(Math.random() * width), Math.round(Math.random() * height)];
};

const getRandomVelocity = () => {
    return Math.round(Math.random() * 20) + 5;
};

const end = () => {
    mainContainer.className = 'main-container hidden';
    clearInterval(laserUpdateInterval);
    endTimeout = undefined;
    laserUpdateInterval = undefined;
};

const updatePoints = () => {
    positions.forEach((position, index) => {
        let element = document.getElementById(`${index}`);
        element.style = `left: ${position[0]}px; bottom: ${position[1]}px;`;
        if(index === 0){
            pointerCore.style = `left: ${position[0]}px; bottom: ${position[1]}px;`;
        }
    });
};

const calculateNextCoordinate = (current, dest) => {
    if(current === dest){
        return dest;
    }
    if(current < dest){
        return Math.min(current + velocity, dest);
    }
    return Math.max(current - velocity, dest);
}

const calculateNextPoint = (currentPoint) => {
    const [currentPointX, currentPointY] = currentPoint;
    const [destinationX, destinationY] = destination;
    return [calculateNextCoordinate(currentPointX, destinationX), calculateNextCoordinate(currentPointY, destinationY)];
};

const moveLaser = () => {
    const currentLaserPosition = positions[0];
    if(currentLaserPosition[0] === destination[0] && currentLaserPosition[1] === destination[1]) {
        destination = getRandomPoint();
        velocity = getRandomVelocity();
    }
    positions.pop();
    const nextPoint = calculateNextPoint(currentLaserPosition);
    positions.unshift(nextPoint);
    updatePoints();
};

const initalizeLaser = () => {
    const { laserDuration } = fieldData;
    if(endTimeout){
        clearTimeout(endTimeout);
        endTimeout = setTimeout(end, laserDuration * 1000);
        return;
    }
    mainContainer.className = 'main-container';

    const randomPoint = getRandomPoint();
    for(let x = 0; x < numberOfSegments; x++){
        positions.push(randomPoint);
    }

    destination = getRandomPoint();
    velocity = getRandomVelocity();
    endTimeout = setTimeout(end, laserDuration * 1000);
    laserUpdateInterval = setInterval(moveLaser, 17);
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
    const { laserCommand } = fieldData;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(laserCommand.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    initalizeLaser();
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

