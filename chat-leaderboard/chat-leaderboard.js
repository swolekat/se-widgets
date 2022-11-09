let fieldData;

const leaderboardContents = document.getElementById('leaderboard-contents');

let chatterData = [];

const renderChatter = (userName, index) => {
    return `<div class="chatter">${index + 1}. ${userName}</div>`
};

const renderLeaderboardData = (topChatters) => {
    const chatters = topChatters.map(renderChatter).join('\n');
    leaderboardContents.innerHTML = chatters;
};

const calculateLeaderboardData = () => {
    const numberOfPlaces = fieldData.numberOfPlaces || 3;
    const sortedChatterData = chatterData.sort((a, b) => b.count - a.count);
    const topChatters = sortedChatterData.slice(0, numberOfPlaces).map(chatter => chatter.name);
    return JSON.parse(JSON.stringify(topChatters));
};

const shouldIgnoreUser = (userName) => {
    const ignoredUsersString = fieldData.ignoredUsers || '';
    const ignoredUsers = ignoredUsersString.split('');
    return ignoredUsers.find(u => u.toLowerCase() === userName.toLowerCase());
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
});

