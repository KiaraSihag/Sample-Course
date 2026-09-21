// ======================================================
// AI TUTOR - FINAL SCRIPT.JS
// ======================================================


// ======================================================
// ELEMENTS
// ======================================================

const messages =
    document.getElementById("messages");

const question =
    document.getElementById("question");

const sendBtn =
    document.getElementById("sendBtn");

const micBtn =
    document.getElementById("micBtn");

const attachBtn =
    document.getElementById("attachBtn");

const imageInput =
    document.getElementById("imageInput");


// ======================================================
// IMAGE STATE
// ======================================================

let selectedImage = null;


// ======================================================
// LEARNER ID
// ======================================================

let learnerId =
    localStorage.getItem(
        "aiTutorLearnerId"
    );


if (!learnerId) {

    learnerId =
        crypto.randomUUID();

    localStorage.setItem(
        "aiTutorLearnerId",
        learnerId
    );

}


// ======================================================
// SESSION ID
// ======================================================

let sessionId =
    localStorage.getItem(
        "aiTutorSessionId"
    );


if (!sessionId) {

    sessionId =
        crypto.randomUUID();

    localStorage.setItem(
        "aiTutorSessionId",
        sessionId
    );

}


// ======================================================
// LOCAL CONVERSATION HISTORY
// ======================================================

const conversationStorageKey =
    "aiTutorConversation_" + sessionId;


// ======================================================
// SAVE CONVERSATION TURN
// ======================================================

function saveConversationTurn(
    userText,
    aiText
) {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    conversationStorageKey
                ) || "[]"
            );


        history.push({

            role: "user",

            text:
                userText || "",

            timestamp:
                new Date().toISOString()

        });


        history.push({

            role: "assistant",

            text:
                aiText || "",

            timestamp:
                new Date().toISOString()

        });


        // Keep the most recent 20 messages
        const recentHistory =
            history.slice(-20);


        localStorage.setItem(
            conversationStorageKey,
            JSON.stringify(
                recentHistory
            )
        );

    }

    catch (error) {

        console.warn(
            "Could not save conversation history:",
            error
        );

    }

}


// ======================================================
// RESTORE CONVERSATION HISTORY
// ======================================================

function restoreConversationHistory() {

    try {

        const savedHistory =
            JSON.parse(
                localStorage.getItem(
                    conversationStorageKey
                ) || "[]"
            );


        if (
            !Array.isArray(savedHistory) ||
            savedHistory.length === 0
        ) {

            return;

        }


        // Remove the initial HTML welcome message
        messages.innerHTML = "";


        savedHistory.forEach(
            item => {

                if (
                    item.role === "user"
                ) {

                    addUserMessage(
                        item.text,
                        null,
                        item.timestamp
                    );

                }


                if (
                    item.role === "assistant"
                ) {

                    addAIMessage(
                        item.text,
                        item.timestamp
                    );

                }

            }
        );


        scrollMessagesToBottom(
            false
        );

    }

    catch (error) {

        console.warn(
            "Could not restore conversation history:",
            error
        );

    }

}


// ======================================================
// STORYLINE CONTEXT
// ======================================================

const aiContext = {

    course: "",

    module: "",

    slide: ""

};


// ======================================================
// UPDATE STORYLINE CONTEXT
// ======================================================

function updateStorylineContext() {

    try {

        const player =
            GetPlayer();


        aiContext.course =
            player.GetVar(
                "CourseName"
            ) || "";


        aiContext.module =
            player.GetVar(
                "ModuleName"
            ) || "";


        aiContext.slide =
            player.GetVar(
                "SlideName"
            ) || "";


        console.log(
            "AI Tutor Context:",
            aiContext
        );

    }

    catch (error) {

        console.warn(
            "Storyline variables unavailable:",
            error
        );

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text || "";


    return div.innerHTML;

}


// ======================================================
// MESSAGE TIME
// ======================================================

function getMessageTime(
    timestamp = null
) {

    const date =
        timestamp
            ? new Date(timestamp)
            : new Date();


    return date.toLocaleTimeString(
        [],
        {

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


// ======================================================
// SCROLL TO BOTTOM
// ======================================================

function scrollMessagesToBottom(
    smooth = true
) {

    if (!messages) {

        return;

    }


    const scroll =
        () => {

            messages.scrollTo({

                top:
                    messages.scrollHeight,

                behavior:
                    smooth
                        ? "smooth"
                        : "auto"

            });

        };


    scroll();


    requestAnimationFrame(
        () => {

            scroll();


            requestAnimationFrame(
                () => {

                    scroll();

                }
            );

        }
    );


    setTimeout(
        scroll,
        50
    );


    setTimeout(
        scroll,
        150
    );


    setTimeout(
        scroll,
        300
    );

}


// ======================================================
// REFRESH MESSAGE LAYOUT
// ======================================================

function refreshMessageLayout() {

    if (!messages) {

        return;

    }


    scrollMessagesToBottom();


    const images =
        messages.querySelectorAll(
            "img"
        );


    images.forEach(
        image => {

            if (
                image.complete
            ) {

                scrollMessagesToBottom();

            }

            else {

                image.addEventListener(
                    "load",
                    () => {

                        scrollMessagesToBottom();

                    },
                    {
                        once:
                            true
                    }
                );

            }

        }
    );


    setTimeout(
        () => {

            scrollMessagesToBottom();

        },
        350
    );

}


// ======================================================
// MARKDOWN RENDERING
// ======================================================

function renderMarkdown(text) {

    if (
        typeof marked ===
        "undefined"
    ) {

        return escapeHTML(
            text || ""
        ).replace(
            /\n/g,
            "<br>"
        );

    }


    let html;


    try {

        html =
            marked.parse(
                text || ""
            );

    }

    catch (error) {

        console.error(
            "Markdown rendering error:",
            error
        );


        return escapeHTML(
            text || ""
        ).replace(
            /\n/g,
            "<br>"
        );

    }


    // ------------------------------------------
    // KEEP TABLES INSIDE THE AI BUBBLE
    // ------------------------------------------

    html =
        html.replace(
            /<table(\s[^>]*)?>/gi,
            match =>
                `<div class="table-wrapper">${match}`
        );


    html =
        html.replace(
            /<\/table>/gi,
            "</table></div>"
        );


    return html;

}


// ======================================================
// ADD USER MESSAGE
// ======================================================

function addUserMessage(
    text,
    imageData = null,
    timestamp = null
) {

    if (!messages) {

        return;

    }


    const user =
        document.createElement(
            "div"
        );


    user.className =
        "user-message";


    let imageHTML =
        "";


    if (imageData) {

        imageHTML = `

            <div class="user-image-preview">

                <img
                    src="${imageData}"
                    alt="Attached image"
                >

            </div>

        `;

    }


    const safeText =
        escapeHTML(
            text ||
            (
                imageData
                    ? "Attached image"
                    : ""
            )
        );


    user.innerHTML = `

        ${imageHTML}

        <div class="message-text">

            <img
                src="images/learner.png"
                alt="Learner"
                class="learner-icon"
            >

            <span>
                ${safeText}
            </span>

        </div>

        <div class="message-time">

            ${getMessageTime(timestamp)}

        </div>

    `;


    messages.appendChild(
        user
    );


    refreshMessageLayout();

}


// ======================================================
// ADD AI MESSAGE
// ======================================================

function addAIMessage(
    text,
    timestamp = null
) {

    if (!messages) {

        return;

    }


    const aiMessage =
        document.createElement(
            "div"
        );


    aiMessage.className =
        "ai-message";


    aiMessage.innerHTML = `

        <div class="ai-header">

            <img
                src="images/ai-tutor.png"
                alt="AI Tutor"
                class="ai-tutor-icon"
            >

            <span>
                AI Tutor
            </span>

        </div>

        <div class="ai-content">

            ${renderMarkdown(text)}

        </div>

        <div class="message-time">

            ${getMessageTime(timestamp)}

        </div>

    `;


    messages.appendChild(
        aiMessage
    );


    refreshMessageLayout();

}


// ======================================================
// CREATE THINKING MESSAGE
// ======================================================

function createThinkingMessage() {

    const thinking =
        document.createElement(
            "div"
        );


    thinking.className =
        "ai-message";


    thinking.innerHTML = `

        <div class="ai-header">

            <img
                src="images/ai-tutor.png"
                alt="AI Tutor"
                class="ai-tutor-icon"
            >

            <span>
                AI Tutor
            </span>

        </div>

        <div class="typing-row">

            <div class="typing-indicator">

                <span></span>

                <span></span>

                <span></span>

            </div>

        </div>

    `;


    messages.appendChild(
        thinking
    );


    refreshMessageLayout();


    return thinking;

}


// ======================================================
// RETRY MESSAGE
// ======================================================

function showRetryMessage(
    thinking,
    attempt
) {

    if (!thinking) {

        return;

    }


    thinking.innerHTML = `

        <div class="ai-header">

            <img
                src="images/ai-tutor.png"
                alt="AI Tutor"
                class="ai-tutor-icon"
            >

            <span>
                AI Tutor
            </span>

        </div>

        <div class="ai-content">

            AI Tutor is temporarily unavailable.
            Retrying...

        </div>

        <div class="typing-row">

            <div class="typing-indicator">

                <span></span>

                <span></span>

                <span></span>

            </div>

        </div>

    `;


    refreshMessageLayout();

}


// ======================================================
// SHOW AI ANSWER
// ======================================================

function showAIAnswer(
    thinking,
    answer,
    timestamp = null
) {

    if (!thinking) {

        return;

    }


    thinking.innerHTML = `

        <div class="ai-header">

            <img
                src="images/ai-tutor.png"
                alt="AI Tutor"
                class="ai-tutor-icon"
            >

            <span>
                AI Tutor
            </span>

        </div>

        <div class="ai-content">

            ${renderMarkdown(answer)}

        </div>

        <div class="message-time">

            ${getMessageTime(timestamp)}

        </div>

    `;


    refreshMessageLayout();

}


// ======================================================
// INPUT ENABLE / DISABLE
// ======================================================

function setInputEnabled(
    enabled
) {

    if (sendBtn) {

        sendBtn.disabled =
            !enabled;

    }


    if (question) {

        question.disabled =
            !enabled;

    }


    if (micBtn) {

        micBtn.disabled =
            !enabled;

    }


    if (attachBtn) {

        attachBtn.disabled =
            !enabled;

    }

}


// ======================================================
// ATTACHMENT
// ======================================================

if (
    attachBtn &&
    imageInput
) {

    attachBtn.addEventListener(
        "click",
        () => {

            imageInput.click();

        }
    );


    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files &&
                imageInput.files[0];


            if (!file) {

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image file."
                );


                imageInput.value =
                    "";


                return;

            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                alert(
                    "Please select an image smaller than 5 MB."
                );


                imageInput.value =
                    "";


                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    selectedImage = {

                        name:
                            file.name,

                        type:
                            file.type,

                        data:
                            event.target.result

                    };


                    showImagePreview();

                };


            reader.onerror =
                error => {

                    console.error(
                        "Image reading failed:",
                        error
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// ======================================================
// IMAGE PREVIEW
// ======================================================

function showImagePreview() {

    if (!selectedImage) {

        return;

    }


    let preview =
        document.getElementById(
            "image-preview"
        );


    if (!preview) {

        preview =
            document.createElement(
                "div"
            );


        preview.id =
            "image-preview";


        const inputArea =
            document.getElementById(
                "input-area"
            );


        if (inputArea) {

            inputArea.insertBefore(
                preview,
                question
            );

        }

    }


    preview.innerHTML = `

        <div class="image-preview-inner">

            <img
                src="${selectedImage.data}"
                alt="Selected image"
            >

            <button
                type="button"
                id="removeImageBtn"
                title="Remove image"
            >

                ×

            </button>

        </div>

    `;


    const removeImageBtn =
        document.getElementById(
            "removeImageBtn"
        );


    if (removeImageBtn) {

        removeImageBtn.addEventListener(
            "click",
            removeSelectedImage
        );

    }

}


// ======================================================
// REMOVE IMAGE
// ======================================================

function removeSelectedImage() {

    selectedImage =
        null;


    if (imageInput) {

        imageInput.value =
            "";

    }


    const preview =
        document.getElementById(
            "image-preview"
        );


    if (preview) {

        preview.remove();

    }

}


// ======================================================
// IMAGE PAYLOAD
// ======================================================

function prepareImagePayload() {

    if (!selectedImage) {

        return null;

    }


    const commaIndex =
        selectedImage.data.indexOf(
            ","
        );


    let base64Data =
        selectedImage.data;


    if (
        commaIndex !== -1
    ) {

        base64Data =
            selectedImage.data.substring(
                commaIndex + 1
            );

    }


    return {

        mimeType:
            selectedImage.type,

        data:
            base64Data

    };

}


// ======================================================
// ASK AI
// ======================================================

async function askAI() {

    if (
        !question ||
        !sendBtn ||
        !messages
    ) {

        return;

    }


    const text =
        question.value.trim();


    if (
        !text &&
        !selectedImage
    ) {

        return;

    }


    updateStorylineContext();


    const imagePayload =
        prepareImagePayload();


    const displayedImage =
        selectedImage
            ? selectedImage.data
            : null;


    addUserMessage(
        text,
        displayedImage
    );


    question.value =
        "";


    removeSelectedImage();


    const thinking =
        createThinkingMessage();


    setInputEnabled(
        false
    );


    const maxAttempts =
        3;


    const retryDelays = [

        0,
        2000,
        5000

    ];


    let successful =
        false;


    let lastError =
        null;


    for (
        let attempt = 1;

        attempt <= maxAttempts;

        attempt++
    ) {

        try {

            if (
                attempt > 1
            ) {

                showRetryMessage(
                    thinking,
                    attempt
                );


                await new Promise(
                    resolve => {

                        setTimeout(
                            resolve,
                            retryDelays[
                                attempt - 1
                            ]
                        );

                    }
                );

            }


            const requestBody = {

                question:
                    text,

                course:
                    aiContext.course,

                module:
                    aiContext.module,

                slide:
                    aiContext.slide,

                learnerId:
                    learnerId,

                sessionId:
                    sessionId

            };


            if (imagePayload) {

                requestBody.image =
                    imagePayload;

            }


            const response =
                await fetch(
                    "http://localhost:3000/ask",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                requestBody
                            )

                    }
                );


            let data;


            try {

                data =
                    await response.json();

            }

            catch (jsonError) {

                throw new Error(
                    "The server returned an invalid response."
                );

            }


            if (
                response.status === 503 ||
                data.retryable === true
            ) {

                lastError =
                    new Error(
                        data.answer ||
                        "Temporary AI service error."
                    );


                if (
                    attempt <
                    maxAttempts
                ) {

                    showRetryMessage(
                        thinking,
                        attempt
                    );

                }


                continue;

            }


            if (
                !response.ok
            ) {

                throw new Error(
                    data.answer ||
                    "AI Tutor request failed."
                );

            }


            const answer =
                data.answer ||
                "I'm sorry, but I couldn't generate an answer.";
            
            
            showAIAnswer(
    thinking,
    answer
            );
            
            
            // Save the completed conversation turn
            saveConversationTurn(
                text,
                answer
            );
            
            
            successful =
                true;


            lastError =
                null;


            break;

        }

        catch (error) {

            console.error(
                `AI attempt ${attempt} failed:`,
                error
            );


            lastError =
                error;


            if (
                attempt <
                maxAttempts
            ) {

                showRetryMessage(
                    thinking,
                    attempt
                );

            }

        }

    }


    if (!successful) {

        thinking.innerHTML = `

            <div class="ai-header">

                <img
                    src="images/ai-tutor.png"
                    alt="AI Tutor"
                    class="ai-tutor-icon"
                >

                <span>
                    AI Tutor
                </span>

            </div>

            <div class="ai-content">

                AI Tutor is temporarily unavailable.
                Please try again in a moment.

            </div>

            <div class="message-time">

                ${getMessageTime()}

            </div>

        `;


        refreshMessageLayout();


        console.error(
            "AI Tutor final error:",
            lastError
        );

    }


    setInputEnabled(
        true
    );


    question.focus();


    refreshMessageLayout();
}


// ======================================================
// MICROPHONE
// ======================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition =
    null;


let isListening =
    false;


if (
    SpeechRecognition &&
    micBtn
) {

    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;


    recognition.interimResults =
        true;


    recognition.lang =
        "en-US";


    micBtn.addEventListener(
        "click",
        () => {

            if (
                isListening
            ) {

                recognition.stop();

                return;

            }


            try {

                recognition.start();

            }

            catch (error) {

                console.warn(
                    "Microphone could not start:",
                    error
                );

            }

        }
    );


    recognition.onstart =
        () => {

            isListening =
                true;


            micBtn.classList.add(
                "listening"
            );


            micBtn.title =
                "Stop listening";

        };


    recognition.onresult =
        event => {

            let finalTranscript =
                "";


            for (
                let i =
                    event.resultIndex;

                i <
                    event.results.length;

                i++
            ) {

                const transcript =
                    event.results[i][0]
                        .transcript;


                if (
                    event.results[i]
                        .isFinal
                ) {

                    finalTranscript +=
                        transcript;

                }

            }


            if (
                finalTranscript.trim()
            ) {

                const existing =
                    question.value.trim();


                question.value =
                    existing

                        ? `${existing} ${finalTranscript.trim()}`

                        : finalTranscript.trim();

            }

        };


    recognition.onend =
        () => {

            isListening =
                false;


            micBtn.classList.remove(
                "listening"
            );


            micBtn.title =
                "Voice input";

        };


    recognition.onerror =
        event => {

            console.warn(
                "Microphone error:",
                event.error
            );


            isListening =
                false;


            micBtn.classList.remove(
                "listening"
            );


            micBtn.title =
                "Voice input";

        };

}

else if (
    micBtn
) {

    micBtn.disabled =
        true;


    micBtn.title =
        "Voice input is not supported in this browser.";

}


// ======================================================
// SEND BUTTON
// ======================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        askAI
    );

}


// ======================================================
// ENTER TO SEND
// ======================================================

if (question) {

    question.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                askAI();

            }

        }
    );

}


// ======================================================
// MESSAGE RESIZE OBSERVER
// ======================================================
//
// Keeps the chat scrolled correctly when
// images or tables change the height of a message.
//

if (
    messages &&
    typeof ResizeObserver !==
        "undefined"
) {

    const resizeObserver =
        new ResizeObserver(
            () => {

                scrollMessagesToBottom();

            }
        );


    const observeMessages =
        () => {

            const bubbles =
                messages.querySelectorAll(
                    ".ai-message, .user-message"
                );


            bubbles.forEach(
                bubble => {

                    resizeObserver.observe(
                        bubble
                    );

                }
            );

        };


    observeMessages();


    const mutationObserver =
        new MutationObserver(
            () => {

                observeMessages();

            }
        );


    mutationObserver.observe(
        messages,
        {

            childList:
                true,

            subtree:
                true

        }
    );

}


// ======================================================
// INITIALIZE
// ======================================================

updateStorylineContext();


// Restore previous conversation
restoreConversationHistory();


scrollMessagesToBottom(
    false
);

