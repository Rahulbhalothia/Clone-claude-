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
