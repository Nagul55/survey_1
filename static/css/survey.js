// Map user input like "tamil" to TTS/Recognition code.
const langMap = {
    "english": "en-US",
    "en": "en-US",
    "hindi": "hi-IN",
    "hi": "hi-IN",
    "tamil": "ta-IN",
    "ta": "ta-IN",
    "telugu": "te-IN",
    "te": "te-IN",
    "kannada": "kn-IN",
    "kn": "kn-IN",
    "malayalam": "ml-IN",
    "ml": "ml-IN"
    // add more if needed
};

// Get the preferred language string from page variable
let preferredLangCode = langMap[window.preferredLangInput] || "en-US";

function getVoiceForLang(langCode) {
    let voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
    if (voice) return voice;
    let partialVoice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase().split('-')[0]));
    if (partialVoice) return partialVoice;
    return voices.find(v => v.lang.toLowerCase().startsWith('en')) || null;
}

function speakText(text, onEndCallback) {
    if (!('speechSynthesis' in window)) {
        alert('Sorry, your browser does not support speech synthesis.');
        if (onEndCallback) onEndCallback();
        return;
    }
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
        window.speechSynthesis.onvoiceschanged = () => {
            speakText(text, onEndCallback);
        };
        window.speechSynthesis.getVoices();
        return;
    }
    const voice = getVoiceForLang(preferredLangCode);
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
    }
    utterance.onend = () => {
        if (onEndCallback) onEndCallback();
    };
    speechSynthesis.speak(utterance);
}

function listenForTextInput(inputId) {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Sorry, your browser does not support speech recognition.');
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = preferredLangCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event) => {
        document.getElementById(inputId).value = event.results[0][0].transcript;
    };
    recognition.onerror = (event) => {
        alert('Speech recognition error: ' + event.error);
    };
    recognition.start();
}

function speakQuestion(questionId, questionText, options) {
    let fullText = `${questionText}. Options: ${options.join(', ')}`;
    speakText(fullText, function() {
        listenForAnswer(questionId, options);
    });
}

function listenForAnswer(questionId, options) {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Sorry, your browser does not support speech recognition.');
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = preferredLangCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        let matchedOption = null;
        for (const opt of options) {
            if (transcript.includes(opt.toLowerCase())) {
                matchedOption = opt;
                break;
            }
        }
        if (matchedOption) {
            const radios = document.getElementsByName(questionId);
            for (const radio of radios) {
                if (radio.value === matchedOption) {
                    radio.checked = true;
                    radio.parentElement.style.backgroundColor = '#d3ffd3';
                    break;
                }
            }
        } else {
            alert('Response not recognized as one of the options. Please try again.');
        }
    };

    recognition.onerror = (event) => {
        alert('Speech recognition error: ' + event.error);
    };

    recognition.start();
}
