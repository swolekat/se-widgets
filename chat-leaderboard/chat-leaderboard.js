let fieldData;
let broadcasterName;

const leaderboardContents = document.getElementById('leaderboard-contents');

let chatterData = [];

const renderChatter = (chatter, index) => {
    const {name, count} = chatter;
    return `<div class="chatter">${index + 1}. ${name} ${count}</div>`
};

const renderLeaderboardData = (topChatters) => {
    const chatters = topChatters.map(renderChatter).join('\n');
    leaderboardContents.innerHTML = chatters;
};

const calculateLeaderboardData = () => {
    const numberOfPlaces = fieldData.numberOfPlaces || 3;
    const sortedChatterData = chatterData.sort((a, b) => b.count - a.count);
    const topChatters = sortedChatterData.slice(0, numberOfPlaces);
    return JSON.parse(JSON.stringify(topChatters));
};

const shouldIgnoreUser = (userName) => {
    const ignoreBroadcaster = fieldData.ignoreBroadcaster;
    if(ignoreBroadcaster && userName.toLowerCase() === broadcasterName.toLowerCase()){
        return true;
    }
    const ignoredUsersString = fieldData.ignoredUsers || '';
    const ignoredUsers = ignoredUsersString.split(',');
    return ignoredUsers.find(u => u.trim().toLowerCase() === userName.toLowerCase());
};

const incrementUser = (userName) => {
    if(shouldIgnoreUser(userName)){
        return;
    }
    const matchingElement = chatterData.find(datum => datum.name === userName);
    if(!matchingElement){
        chatterData = [...chatterData, {name: userName, count: 1}];
        return;
    }
    matchingElement.count += 1;
};

const handleMessage = (obj) => {
    const data = obj.detail.event.data;
    const currentTopChatters = calculateLeaderboardData();
    const userName = data.displayName;
    incrementUser(userName);
    const newTopChatters = calculateLeaderboardData();
    if(JSON.stringify(newTopChatters) === JSON.stringify(currentTopChatters)){
        return;
    }
    renderLeaderboardData(newTopChatters);
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    broadcasterName = obj.detail.channel.username;
});

