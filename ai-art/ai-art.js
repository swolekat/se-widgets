let fieldData;

const models = [
    "stable_diffusion",
    "waifu_diffusion",
    "Anything Diffusion",
    "trinart",
    "Yiffy",
    "Zack3D",
    "Hentai Diffusion",
    "Elden Ring Diffusion",
    "Cyberpunk Anime Diffusion",
    "mo-di-diffusion",
    "Furry Epoch",
    "stable_diffusion_2.1",
    "Poison"
];

const mainContainer = document.getElementById('main-container');
const image = document.getElementById('img');
let hideTimeout;

const checkPrivileges = (data, privileges) => {
    const {tags, userId} = data;
    const {mod, subscriber, badges} = tags;
    const required = privileges || fieldData.privileges;
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

const show = () => {
    if(hideTimeout){
        clearTimeout(hideTimeout);
        hideTimeout = undefined;
    }
    const showDuration = fieldData.showDuration;
    mainContainer.className = 'main-container';
    if(showDuration > 0){
        hideTimeout = setTimeout(hide, showDuration * 1000);
    }

};

const hide = () => {
    if(hideTimeout){
        clearTimeout(hideTimeout);
        hideTimeout = undefined;
    }
    mainContainer.className = 'main-container hidden';
};

const checkId = (id) => {
    return new Promise(async (resolve) => {
        const status = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
        const data = await status.json();
        resolve(data);
    });
}

const wait = () => {
    return new Promise(resolve => setTimeout(() => resolve(), 31000));
}

const makeArt = async (prompt) => {
    const model = fieldData.model;
    const realModel = model === 'random' ? models[Math.round(Math.random() * 9999) % models.length] : model;

    const jobResponse = await fetch('https://stablehorde.net/api/v2/generate/async', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': '0000000000',
        },
        body: JSON.stringify({
            "prompt":prompt,
            "params":{
                "steps":30,
                "n":1,
                "sampler_name":"k_euler",
                "width":512,
                "height":512,
                "cfg_scale":7,
                "seed_variation":1000,
                "seed":"",
                "karras":true,
                "denoising_strength":0.75,
                "post_processing":[]
            },
            "nsfw":false,
            "censor_nsfw":false,
            "trusted_workers":false,
            "models":[realModel]
        })
    });
    const data = await jobResponse.json();
    const {id} = data;
    let isDone = false;
    while (!isDone){
        const checkData = await checkId(id);
        isDone = checkData?.finished;
        if(isDone){
            image.src=`data:image/webp;base64,${checkData.generations[0].img}`;
            show();
        } else {
            await wait();
        }
    }
};


const handleMessage = (obj) => {
    const command = fieldData.command;
    const data = obj.detail.event.data;
    const text = data.text;

    const textStartsWithCommand = text.toLowerCase().startsWith(command.toLowerCase());
    if (!textStartsWithCommand || !checkPrivileges(data)) {
        return;
    }

    makeArt(text.toLowerCase().replace(command.toLowerCase(), '').trim());
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

