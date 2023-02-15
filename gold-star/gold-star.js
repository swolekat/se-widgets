let fieldData;

let currentIndex = 0;
const MAX_NUMBER_OF_STARS = 3;

const giveStar = (user) => {
    const starContainer = document.getElementById(currentIndex);
    const profilePicture = document.getElementById(`star-profile-${currentIndex}`);
    const text = document.getElementById(`star-text-${currentIndex}`);

    fetch(`https://decapi.me/twitch/avatar/${user}`)
        .then((data) => {
            data.text().then((img) => {
                starContainer.className = 'gold-star';
                profilePicture.src = img;
                text.innerHTML = user;
            });
        });

    currentIndex+=1;
    currentIndex = currentIndex % MAX_NUMBER_OF_STARS;
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
    const data = obj.detail.event.data;
    const {text} = data;
    if(!checkPrivileges(data) || !text.startsWith(fieldData.command)){
        return;
    }
    giveStar(text.replace(fieldData.command, '').replace('@', '').trim());
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

