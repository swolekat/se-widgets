let fieldData;
let chatAssistant;
let apiToken;

class ChatAssistant {
    static systemMessage = '{systemMessages}';

    static unknownResponses = ['I don\'t know.'];

    static dontKnowResponses = [
        'I\'m at a loss.',
        'I don\'t know.',
        'That\'s beyond me.',
        'I\'m in the dark.',
        'I\'m clueless.',
        'I\'m haven\'t a clue.',
        'I\'m unsure.',
        'I\'m not sure.',
        "I'm completely at a loss for words.",
        "That's something that is beyond me.",
        "I'm totally in the dark on this one.",
        "I'm in way over my head here.",
        "I'm totally clueless about this.",
        "I haven't a single clue what to do.",
        "I'm out of my element here.",
        "I'm really unsure about that.",
        "I'm in the dark about this.",
        "I'm not sure what to do."
    ];

    static errorMessages = [
        'If I was an AI I might be down right now. Hold me.',
    ];

    constructor() {
        this.talking = false;
    }


    // tts section
    sayMessage(fullMessage) {
        const url = `http://api.streamelements.com/kappa/v2/speech?voice={voice}&text=${encodeURI(fullMessage)}&key=${apiToken}`
        const myAudio = new Audio(url);
        myAudio.volume = fieldData.volume;
        myAudio.play();
        myAudio.addEventListener('ended', () => {
            this.talking = false;
        });
    }

    sentenceIsAiMentioningSentence(sentence) {
        return sentence.toLowerCase().includes('ai language model') ||
            sentence.toLowerCase().includes('ai model') ||
            sentence.toLowerCase().includes('virtual assistant') ||
            sentence.toLowerCase().includes('virtual character');
    }

    getMessagesToSend(message) {
        return [
            {
                role: 'system',
                content: ChatAssistant.systemMessage,
            },
            {
                role: 'user',
                content: message
            }
        ];
    }

    sayAndCaptionMessage(message){
        this.sayMessage(message);
    }

    async talk(message) {
        if(this.talking){
            return;
        }
        this.talking = true;
        const openAIApiKey = '{openAIApiKey}';
        const model = 'gpt-3.5-turbo';
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer {openAIApiKey}`,
            },
            body: JSON.stringify({
                model,
                messages: this.getMessagesToSend(message),
            }),
        });
        const jsonResponse = await response.json();
        if(jsonResponse.error){
            const errorResponse = ChatAssistant.errorMessages[Math.round(Math.random() * 1000) % ChatAssistant.errorMessages.length];
            this.sayAndCaptionMessage(errorResponse, false);
            return;
        }
        const responseToSay = jsonResponse.choices[0].message.content;
        const responseSentences = responseToSay.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
        const hasAiSentence = responseSentences.some(this.sentenceIsAiMentioningSentence);
        let nonAiResponse = responseSentences.filter(s => {
            return !this.sentenceIsAiMentioningSentence(s);
        }).join(' ');
        if (hasAiSentence) {
            const dontKnowResponse = ChatAssistant.dontKnowResponses[Math.round(Math.random() * 1000) % ChatAssistant.dontKnowResponses.length];
            nonAiResponse = `${dontKnowResponse} ${nonAiResponse}`;
        }

        const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer {openAIApiKey}`,
            },
            body: JSON.stringify({
                input: nonAiResponse,
            }),
        });
        const moderationResponseJson = await moderationResponse.json();
        const shouldntSay = Object.values(moderationResponseJson.results[0].categories).some(c => !!c);
        if (shouldntSay) {
            const dontKnowResponse = ChatAssistant.unknownResponses[Math.round(Math.random() * 1000) % ChatAssistant.unknownResponses.length];
            this.sayAndCaptionMessage(dontKnowResponse);
            return;
        }
        const goodResponse = nonAiResponse.replace('\n', '').replace(/&/g, ' and ');
        this.sayAndCaptionMessage(goodResponse);
    }
}
// COPY THIS FROM OTHER FILE


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


const handleMessage = async (obj) => {
    const data = obj.detail.event.data;
    const {text} = data;
    if (!text.startsWith('{command}') || !checkPrivileges(data, '{privileges}')) {
        return;
    }
    const promptParts = text.split(' ');
    // get rid of !ask
    promptParts.shift();
    const prompt = promptParts.join(' ');

    chatAssistant.talk(prompt);
};

window.addEventListener('onEventReceived', function (obj) {
    if (obj.detail.listener !== "message") {
        return;
    }
    handleMessage(obj);
});

window.addEventListener('onWidgetLoad', function (obj) {
    fieldData = obj.detail.fieldData;
    chatAssistant = new ChatAssistant(false);
    apiToken = obj.detail.channel.apiToken;
});
