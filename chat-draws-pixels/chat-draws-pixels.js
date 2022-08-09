let fieldData = {};

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
    const drawCommand = fieldData.drawCommand;
    const data = obj.detail.event.data;
    const {text} = data;
    const textStartsWithCommand = text.toLowerCase().startsWith(drawCommand.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    const [stringX, stringY, color] = text.toLowerCase().replace(drawCommand.toLowerCase(), '').trim().split(' ');
    const x = Number.parseInt(stringX, 10);
    const y = Number.parseInt(stringY, 10);
    const index = x + (y * 8);
    const gridItem  = document.getElementById(`${index}`);
    gridItem.style = `background: ${color}`;
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

