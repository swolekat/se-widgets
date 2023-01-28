let fieldData;

const bonkQueue = [];
let isBonking = false;

const mainContainer = document.getElementById('main-container');
const bonkee = document.getElementById('bonkee');
const bat = document.getElementById('bat');
const sound = document.getElementById('sound');

const hideJail = () => {
    mainContainer.className = 'main-container hidden';

};

const jailUser = (user) => {
    return new Promise((resolve) => {
        fetch(`https://decapi.me/twitch/avatar/${user}`)
            .then((data) => {
                data.text().then((img) => {
                    bonkee.src = img;
                    mainContainer.className = 'main-container';
                    setTimeout(() => {
                        bat.className = 'bonk animate';
                        sound.play();
                        setTimeout(() => {
                            bonkee.className = 'bonkee animate';
                            setTimeout(() => {
                                mainContainer.className = 'main-container hidden';
                                bat.className = 'bonk';
                                bonkee.className = 'bonkee';
                                resolve();
                            }, 1000);

                        }, 500);
                    }, 1000);
                }).catch(() => {
                    resolve();
                });
            })
            .catch(() => {
                resolve();
            });
    });

};

const handleMessage = (obj) => {
    const jailWords = (fieldData.jailWords || '').split(',');
    const data = obj.detail.event.data;
    const {text, name} = data;
    const words = text.split(' ');
    const shouldGoToJail = words.some(word => jailWords.includes(word.toLowerCase()));
    if(!shouldGoToJail){
        return;
    }
    jailUser(name);
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

