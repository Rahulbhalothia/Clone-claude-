// ======================================
// Claude Clone
// Part 1.3A-1
// ======================================

// DOM Elements
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const newChatBtn = document.getElementById("newChat");
const history = document.getElementById("history");
const messages = document.getElementById("messages");
const chatArea = document.getElementById("chatArea");
const prompt = document.getElementById("prompt");
const send = document.getElementById("send");
const thinking = document.getElementById("thinking");

// Conversations
let conversations = JSON.parse(
localStorage.getItem("claude_conversations") || "[]"
);

let activeConversation = null;

// ==============================
// Save
// ==============================

function saveChats(){

localStorage.setItem(

"claude_conversations",

JSON.stringify(conversations)

);

}

// ==============================
// New Chat
// ==============================

function newChat(){

const chat={

id:Date.now().toString(),

title:"New Chat",

favorite:false,

messages:[]

};

conversations.unshift(chat);

activeConversation=chat.id;

saveChats();

renderHistory();

renderMessages();

}

newChatBtn.onclick=newChat;

// ==============================
// Sidebar
// ==============================

menuBtn.onclick=()=>{

sidebar.classList.toggle("hide");

};

// ==============================
// History
// ==============================

function renderHistory(){

history.innerHTML="";

conversations.forEach(chat=>{

const item=document.createElement("div");

item.className="chat-item";

if(chat.id===activeConversation){

item.classList.add("active");

}

item.innerHTML = `
<span>${chat.favorite ? "⭐ " : ""}${chat.title}</span>
`;

item.onclick=()=>{

activeConversation=chat.id;

renderHistory();

renderMessages();

};

history.appendChild(item);

});

}

// ==============================
// Active Chat
// ==============================

function getChat(){

return conversations.find(

c=>c.id===activeConversation

);

}

// ==============================
// Init
// ==============================

function init(){

if(conversations.length===0){

newChat();

}else{

activeConversation=conversations[0].id;

renderHistory();

renderMessages();

}

}

init();// ======================================
// Claude Clone
// Part 1.3A-2
// ======================================

// Render Messages
function renderMessages() {

const chat = getChat();

messages.innerHTML = "";

if (!chat || chat.messages.length === 0) {

document.querySelector(".welcome").style.display = "block";
return;

}

document.querySelector(".welcome").style.display = "none";

chat.messages.forEach(msg => {

addMessage(msg.role, msg.content, false);

});

scrollBottom();

}

// Add Message
function addMessage(role, text, save = true) {

const wrapper = document.createElement("div");

wrapper.className = "message " + (role === "user" ? "user" : "ai");

if (role === "ai") {

const avatar = document.createElement("div");

avatar.className = "avatar";

wrapper.appendChild(avatar);

}

const bubble = document.createElement("div");

bubble.className = "bubble";

if (role === "ai") {

bubble.innerHTML = marked.parse(text);

} else {

bubble.textContent = text;

}

wrapper.appendChild(bubble);

messages.appendChild(wrapper);

document.querySelectorAll("pre code").forEach(block => {

hljs.highlightElement(block);

});

scrollBottom();

if (save) {

const chat = getChat();

chat.messages.push({

role,

content: text

});

if (chat.title === "New Chat" && role === "user") {

chat.title = text.substring(0, 35);

renderHistory();

}

saveChats();

}

return bubble;

}

// Scroll Bottom
function scrollBottom() {

setTimeout(() => {

chatArea.scrollTop = chatArea.scrollHeight;

}, 30);

}

// Typing Bubble
function createTypingBubble() {

const wrap = document.createElement("div");

wrap.className = "message ai";

const avatar = document.createElement("div");

avatar.className = "avatar";

const bubble = document.createElement("div");

bubble.className = "bubble cursor";

wrap.appendChild(avatar);

wrap.appendChild(bubble);

messages.appendChild(wrap);

scrollBottom();

return bubble;

}// ======================================
// Claude Clone
// Part 1.3B-1
// AI Request
// ======================================

// IMPORTANT:
// Apna Cloudflare Worker URL yahan daalo.
const WORKER_URL = "https://YOUR-WORKER.workers.dev";

async function sendMessage() {

const text = prompt.value.trim();

if (!text) return;

send.disabled = true;

thinking.classList.remove("hidden");

// User Message

addMessage("user", text);

prompt.value = "";
prompt.style.height = "auto";

// AI Bubble

const bubble = createTypingBubble();

let fullResponse = "";

try {

const response = await fetch(WORKER_URL, {

method: "POST",

headers: {

"Content-Type": "application/json"

},

body: JSON.stringify({

model: "openai/gpt-oss-120b",

reasoning_effort: "high",

temperature: 0.5,

max_completion_tokens: 8192,

stream: true,

messages: [

{

role: "system",

content: `You are Claude, an advanced AI assistant.

Always think carefully.

Give accurate answers.

Explain clearly.

Write beautiful markdown.

Produce high quality code.

Be conversational.

Never hallucinate.

Reason step by step.

If uncertain, clearly say so.`

},

...getChat().messages

]

})

});

if (!response.ok) {

throw new Error("API Error " + response.status);

}

const reader = response.body.getReader();

const decoder = new TextDecoder();

let buffer = "";// ======================================
// Claude Clone
// Part 1.3B-2
// Streaming + Error Handling
// ======================================

while (true) {

const { done, value } = await reader.read();

if (done) break;

buffer += decoder.decode(value, { stream: true });

const chunks = buffer.split("\n\n");

buffer = chunks.pop() || "";

for (const chunk of chunks) {

if (!chunk.startsWith("data:")) continue;

const data = chunk.replace("data:", "").trim();

if (data === "[DONE]") continue;

try {

const json = JSON.parse(data);

const delta = json.choices?.[0]?.delta?.content || "";

if (delta) {

fullResponse += delta;

bubble.innerHTML = marked.parse(fullResponse);

document.querySelectorAll("pre code").forEach(block => {

hljs.highlightElement(block);

});

scrollBottom();

}

} catch (e) {

console.log(e);

}

}

}

// Save Assistant Message

const chat = getChat();

chat.messages.push({

role: "assistant",

content: fullResponse

});

saveChats();

} catch (err) {

bubble.classList.remove("cursor");

bubble.innerHTML = marked.parse(

`## ⚠ Error

${err.message}

Possible reasons:

- Worker URL incorrect
- Worker offline
- Groq API key missing
- Internet problem
`

);

} finally {

thinking.classList.add("hidden");

bubble.classList.remove("cursor");

send.disabled = false;

scrollBottom();

}

}

// ==========================
// Events
// ==========================

send.onclick = sendMessage;

prompt.addEventListener("keydown", e => {

if (e.key === "Enter" && !e.shiftKey) {

e.preventDefault();

sendMessage();

}

});

prompt.addEventListener("input", () => {

prompt.style.height = "auto";

prompt.style.height = prompt.scrollHeight + "px";

});
// ======================================
// Part 3.1
// Search + Rename + Delete
// ======================================

// Search Box
const searchInput = document.createElement("input");

searchInput.placeholder = "Search chats...";

searchInput.className = "search-box";

history.parentNode.insertBefore(searchInput, history);

searchInput.addEventListener("input", () => {

const value = searchInput.value.toLowerCase();

document.querySelectorAll(".chat-item").forEach(item => {

item.style.display =
item.textContent.toLowerCase().includes(value)
? "block"
: "none";

});

});

// Right Click Menu

history.addEventListener("contextmenu", (e)=>{

const item = e.target.closest(".chat-item");

if(!item) return;

e.preventDefault();

const index = [...history.children].indexOf(item);

const chat = conversations[index];

const action = prompt(

"Type:\nrename\nor\ndelete"

);

if(action==="rename"){

const name = prompt(

"New chat name",

chat.title

);

if(name){

chat.title=name;

saveChats();

renderHistory();

}

}

if(action==="delete"){

if(confirm("Delete this chat?")){

conversations.splice(index,1);

if(conversations.length===0){

newChat();

}else{

activeConversation=conversations[0].id;

}

saveChats();

renderHistory();

renderMessages();

}

}

});
// ======================================
// Part 3.2A
// Pin + Favorite + Export
// ======================================

// Pin Chat
function pinChat(chatId){

const index = conversations.findIndex(c=>c.id===chatId);

if(index===-1) return;

const chat = conversations.splice(index,1)[0];

conversations.unshift(chat);

saveChats();

renderHistory();

}

// Export Chat
function exportChat(){

const chat = getChat();

if(!chat) return;

let text = "";

chat.messages.forEach(msg=>{

text += `${msg.role.toUpperCase()}\n`;
text += `${msg.content}\n\n`;

});

const blob = new Blob([text],{
type:"text/plain"
});

const url = URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;

a.download=`${chat.title}.txt`;

a.click();

URL.revokeObjectURL(url);

}

// Favorite
function toggleFavorite(chatId){

const chat = conversations.find(c=>c.id===chatId);

if(!chat) return;

chat.favorite = !chat.favorite;

saveChats();

renderHistory();

}// ======================================
// Part 3.2B
// Import + Copy + Chat Menu
// ======================================

// Copy Current Chat
function copyChat() {

    const chat = getChat();

    if (!chat) return;

    let text = "";

    chat.messages.forEach(msg => {

        text += `${msg.role.toUpperCase()}\n`;
        text += `${msg.content}\n\n`;

    });

    navigator.clipboard.writeText(text);

    alert("Chat copied successfully.");

}

// Import Chat
function importChat(file) {

    const reader = new FileReader();

    reader.onload = function (e) {

        const chat = {

            id: Date.now().toString(),

            title: "Imported Chat",

            favorite: false,

            messages: [

                {

                    role: "assistant",

                    content: e.target.result

                }

            ]

        };

        conversations.unshift(chat);

        activeConversation = chat.id;

        saveChats();

        renderHistory();

        renderMessages();

    };

    reader.readAsText(file);

}

// Hidden File Input

const importInput = document.createElement("input");

importInput.type = "file";

importInput.accept = ".txt";

importInput.style.display = "none";

document.body.appendChild(importInput);

importInput.onchange = (e) => {

    if (e.target.files.length) {

        importChat(e.target.files[0]);

    }

};

// Chat Menu

function showChatMenu() {

    const action = prompt(

`Choose option:

1 = Export

2 = Import

3 = Copy Chat

4 = Pin Chat

5 = Favorite`

);

    switch(action){

        case "1":

            exportChat();

            break;

        case "2":

            importInput.click();

            break;

        case "3":

            copyChat();

            break;

        case "4":

            pinChat(activeConversation);

            break;

        case "5":

            toggleFavorite(activeConversation);

            break;

    }

          }
// ===============================
// Part 4.3
// Image & PDF Upload
// ===============================

const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");

attachBtn.onclick = () => {

fileInput.click();

};

fileInput.onchange = (e) => {

const file = e.target.files[0];

if (!file) return;

if (file.type.startsWith("image/")) {

const reader = new FileReader();

reader.onload = () => {

const img = document.createElement("img");

img.src = reader.result;

img.className = "preview";

messages.appendChild(img);

scrollBottom();

};

reader.readAsDataURL(file);

}

else if (file.type === "application/pdf") {

const div = document.createElement("div");

div.className = "message ai";

div.innerHTML = `
<div class="bubble">
📄 <b>${file.name}</b><br>
PDF attached successfully.
</div>
`;

messages.appendChild(div);

scrollBottom();

}

};
// ======================================
// Part 5
// Voice + Drag & Drop + Draft
// ======================================

// ---------- Voice Input ----------

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (SpeechRecognition) {

const recognition = new SpeechRecognition();

recognition.lang = "en-US";
recognition.continuous = false;
recognition.interimResults = true;

const voiceBtn = document.createElement("button");
voiceBtn.id = "voiceBtn";
voiceBtn.innerHTML = "🎤";
voiceBtn.title = "Voice Input";

document.querySelector(".composer")
.appendChild(voiceBtn);

voiceBtn.onclick = () => {

recognition.start();

};

recognition.onresult = (e) => {

let text = "";

for (let i = e.resultIndex; i < e.results.length; i++) {

text += e.results[i][0].transcript;

}

prompt.value = text;
prompt.dispatchEvent(new Event("input"));

};

recognition.onerror = () => {

showToast("Voice recognition failed.");

};

}

// ---------- Auto Save Draft ----------

const DRAFT_KEY = "claude_draft";

prompt.value = localStorage.getItem(DRAFT_KEY) || "";

prompt.addEventListener("input", () => {

localStorage.setItem(
DRAFT_KEY,
prompt.value
);

});

function clearDraft(){

localStorage.removeItem(DRAFT_KEY);

}

// ---------- Drag & Drop ----------

["dragenter","dragover"].forEach(event=>{

document.addEventListener(event,e=>{

e.preventDefault();

document.body.classList.add("dragging");

});

});

["dragleave","drop"].forEach(event=>{

document.addEventListener(event,e=>{

e.preventDefault();

document.body.classList.remove("dragging");

});

});

document.addEventListener("drop",e=>{

const file=e.dataTransfer.files[0];

if(!file) return;

handleDroppedFile(file);

});

function handleDroppedFile(file){

if(file.type.startsWith("image/")){

const reader=new FileReader();

reader.onload=()=>{

const wrap=document.createElement("div");

wrap.className="preview-item";

wrap.innerHTML=`
<img src="${reader.result}" class="preview">
<button class="remove-preview">✕</button>
`;

document
.getElementById("imagePreview")
.appendChild(wrap);

};

reader.readAsDataURL(file);

}

else if(file.type==="application/pdf"){

const wrap=document.createElement("div");

wrap.className="preview-item";

wrap.innerHTML=`
<div class="pdf-preview">
📄 ${file.name}
</div>

<button class="remove-preview">
✕
</button>
`;

document
.getElementById("pdfPreview")
.appendChild(wrap);

}

bindRemoveButtons();

}

// ---------- Remove Preview ----------

function bindRemoveButtons(){

document
.querySelectorAll(".remove-preview")
.forEach(btn=>{

btn.onclick=()=>{

btn.parentElement.remove();

};

});

}

// ---------- Send Override ----------

const oldSend = sendMessage;

sendMessage = async function(){

await oldSend();

clearDraft();

};// ======================================
// Part 6
// Settings + Theme + Toast + Status
// ======================================

// Elements

const settingsBtn = document.querySelector(".settings");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");

const darkMode = document.getElementById("darkMode");
const streamMode = document.getElementById("streamMode");

const chatMenuBtn = document.getElementById("chatMenu");
const chatMenu = document.getElementById("chatMenuDropdown");

const connectionStatus =
document.getElementById("connectionStatus");

const statusText =
document.getElementById("statusText");

// ==========================
// Settings
// ==========================

settingsBtn.onclick = () => {

settingsModal.classList.remove("hidden");

};

closeSettings.onclick = () => {

settingsModal.classList.add("hidden");

};

settingsModal.onclick = (e)=>{

if(e.target===settingsModal){

settingsModal.classList.add("hidden");

}

};

// ==========================
// Theme
// ==========================

const THEME_KEY="claude_theme";

function applyTheme(theme){

document.body.dataset.theme=theme;

localStorage.setItem(THEME_KEY,theme);

darkMode.checked=(theme==="dark");

}

applyTheme(

localStorage.getItem(THEME_KEY)||"dark"

);

darkMode.onchange=()=>{

applyTheme(

darkMode.checked

? "dark"

: "light"

);

};

// ==========================
// Stream Mode
// ==========================

streamMode.checked=true;

streamMode.onchange=()=>{

showToast(

streamMode.checked

? "Streaming Enabled"

: "Streaming Disabled"

);

};

// ==========================
// Chat Menu
// ==========================

chatMenuBtn.onclick=(e)=>{

e.stopPropagation();

chatMenu.classList.toggle("hidden");

};

document.addEventListener("click",()=>{

chatMenu.classList.add("hidden");

});

// ==========================
// Toast
// ==========================

function showToast(text){

let toast=document.getElementById("toast");

if(!toast){

toast=document.createElement("div");

toast.id="toast";

toast.className="toast";

document.body.appendChild(toast);

}

toast.textContent=text;

toast.classList.remove("hidden");

clearTimeout(toast.timer);

toast.timer=setTimeout(()=>{

toast.classList.add("hidden");

},2500);

}

// ==========================
// Connection Status
// ==========================

function updateConnection(){

if(navigator.onLine){

statusText.textContent="Online";

connectionStatus.style.display="flex";

connectionStatus.querySelector(".status-dot").style.background="#2ecc71";

}

else{

statusText.textContent="Offline";

connectionStatus.style.display="flex";

connectionStatus.querySelector(".status-dot").style.background="#e74c3c";

showToast("No Internet Connection");

}

}

window.addEventListener("online",updateConnection);

window.addEventListener("offline",updateConnection);

updateConnection();// ======================================
// Part 7
// Retry + Stop + Regenerate + Reconnect
// ======================================

// ---------- Generate Control ----------

let abortController = null;
let lastPrompt = "";

// Stop Button

const stopBtn = document.createElement("button");

stopBtn.id = "stopGenerate";

stopBtn.textContent = "⏹ Stop";

stopBtn.style.display = "none";

document.querySelector(".composer").appendChild(stopBtn);

stopBtn.onclick = () => {

    if (abortController) {

        abortController.abort();

        showToast("Generation stopped.");

    }

};

// ---------- Override Send ----------

const oldSendMessage = sendMessage;

sendMessage = async function () {

    lastPrompt = prompt.value.trim();

    abortController = new AbortController();

    stopBtn.style.display = "flex";

    try {

        await oldSendMessage();

    } finally {

        stopBtn.style.display = "none";

    }

};

// ---------- Retry ----------

async function retryResponse() {

    const chat = getChat();

    if (!chat) return;

    if (chat.messages.length === 0) return;

    const last = chat.messages.pop();

    if (last.role === "assistant") {

        saveChats();

        renderMessages();

        prompt.value = lastPrompt;

        sendMessage();

    }

}

// ---------- Regenerate ----------

async function regenerateResponse() {

    const chat = getChat();

    if (!chat) return;

    while (

        chat.messages.length &&

        chat.messages[chat.messages.length - 1].role === "assistant"

    ) {

        chat.messages.pop();

    }

    saveChats();

    renderMessages();

    prompt.value = lastPrompt;

    sendMessage();

}

// ---------- Better Error ----------

window.addEventListener("unhandledrejection", e => {

    console.error(e.reason);

    showToast("Unexpected Error");

});

window.addEventListener("error",
