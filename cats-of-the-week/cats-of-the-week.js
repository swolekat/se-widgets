let fieldData;

const main = document.getElementById('main');
const niceCatImage = document.getElementById('nice-cat-image');
const niceCatName = document.getElementById('nice-cat-name');
const niceCatReason = document.getElementById('nice-cat-reason');
const naughtyCatImage = document.getElementById('naughty-cat-image');
const naughtyCatName = document.getElementById('naughty-cat-name');
const naughtyCatReason = document.getElementById('naughty-cat-reason');

const shouldNotLogUser = ({text, name ,nick}) => {
    if(fieldData.ignorePrefixList.split(',').some(prefix => text.startsWith(prefix))){
        return true;
    }
    const names = [name.toLowerCase() , nick.toLowerCase()];
    if(fieldData.ignoreUserList.split(',').some(user => names.includes(user.toLowerCase()))){
        return true;
    }
    return false;
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

const uniqueUsers = {};

const getRandomUser = (previousUser) => {
    const users = Object.keys(uniqueUsers);
    if(users.length === 1){
        return users[0];
    }
    let user = previousUser;
    do {
        user = users[Math.round((Math.random() * 100000)) % users.length];
    } while(user === previousUser);
    return user;
};

const messageReason = (reason) => {
    const reasonParts = reason.split('because');
    let finalReason = reasonParts[1].trim();
    if(finalReason.startsWith('he')){
        finalReason = finalReason.replace('he ', '');
    }
    if(finalReason.startsWith('she')){
        finalReason = finalReason.replace('she ', '');
    }
    if(finalReason.startsWith('it')){
        finalReason = finalReason.replace('it ', '');
    }
    if(finalReason.startsWith('they')){
        finalReason = finalReason.replace('they ', '');
    }
    return finalReason.trim();
};

const show = async () => {
    const niceUser = getRandomUser();
    niceCatName.innerHTML = niceUser;
    const niceUserImageResponse = await fetch(`https://decapi.me/twitch/avatar/${niceUser}`);
    const niceUserImageUrl = await niceUserImageResponse.text();
    niceCatImage.src = niceUserImageUrl;
    const niceUserReason = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fieldData.openAIApiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [            {
                role: 'user',
                content: `Tell me why ${niceUser} is the nice cat of the week in one sentence. The reason should be very very strange.`,
            }],
        }),
    });
    const niceUserReasonJson = await niceUserReason.json();
    niceCatReason.innerText = messageReason(niceUserReasonJson.choices[0].message.content);

    const naughtyUser = getRandomUser(niceUser);
    naughtyCatName.innerHTML = naughtyUser;
    const naughtyUserImageResponse = await fetch(`https://decapi.me/twitch/avatar/${naughtyUser}`);
    const naughtyUserImageUrl = await naughtyUserImageResponse.text();
    naughtyCatImage.src = naughtyUserImageUrl;
    const naughtyUserReason = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fieldData.openAIApiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [            {
                role: 'user',
                content: `Tell me why ${naughtyUser} is the naughty cat of the week in one sentence. The reason should be very very strange.`,
            }],
        }),
    });
    const naughtyUserReasonJson = await naughtyUserReason.json();
    naughtyCatReason.innerText = messageReason(naughtyUserReasonJson.choices[0].message.content);

    main.className = '';
};

const hide = () => {
    main.className = 'hidden';
};

const onMessage = (event) => {
    const {nick = '', name = '', text = ''} = event.data;
    const {command, privileges} = fieldData;

    if(text === command && checkPrivileges(event.data, privileges)){
        hide();
        show();
    }

    if(shouldNotLogUser({text, name, nick})){
        return;
    }
    uniqueUsers[nick] = 1;
};

window.addEventListener('onEventReceived', obj => {
    const {listener, event} = obj?.detail || {};
    if(listener !== 'message'){
        return;
    }
    onMessage(event);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
});
