let fieldData;

const video = document.getElementById('video');
const clipName = document.getElementById('clip-name');
const channelName = document.getElementById('channel-name');

const getDateRange = () => {
    // Get client current date
    let todayDate = new Date();

    // subtract dateRange from todayDate
    let startDate = new Date(new Date().setDate(todayDate.getDate() - parseInt(90)));

    // format dates
    startDate = startDate.toISOString().slice(0, 10);
    todayDate = todayDate.toISOString().slice(0, 10);

    // set the daterange url parameter for the api endpoint
    return "&start_date=" + startDate + "T00:00:00Z&end_date=" + todayDate + "T00:00:00Z";
};

const getVideoUrl = (broadcaster) => {
    return `https://twitchapi.teklynk.com/getuserclips.php?channel=${broadcaster}&limit=20${getDateRange()}`;
};

const getRandomBroadcaster = () => {
    const broadcasters = fieldData.peopleToShoutOut.split(',');
    return broadcasters[Math.round(Math.random() * 1000000) % broadcasters.length];
};


const playNextVideo = async () => {
    const response = await fetch(getVideoUrl(getRandomBroadcaster()));
    const responseJson = await response.json();
    const clips = responseJson.data;
    const randomClip = clips[Math.round(Math.random() * 100000) % clips.length];
    const {title, broadcaster_name, clip_url} = randomClip;
    clipName.innerText = title;
    channelName.innerText = broadcaster_name;
    video.src = clip_url;
    video.play();
};

const setup = () => {
    video.addEventListener('ended', () => {
        playNextVideo();
    });
    playNextVideo();
};


window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    setup();
});

