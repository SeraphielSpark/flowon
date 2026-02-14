// ============================================
// CONFIGURATION & GLOBAL STATE
// ============================================
const API_BASE_URL = 'https://flowon.onrender.com/api'; 
const flowId = localStorage.getItem('flowid');

// Global Variables
let currentUser = null;
let customers = [];
let templates = [];
let inboxMessages = []; // STORE INBOX MESSAGES
let currentMessageIndex = -1; // TRACK SELECTED MESSAGE
let selectedEmails = new Set();

const defaultTemplates = [
    { name: "Welcome Email", tag: "Onboarding", body: "Welcome to our community! We're excited to have you..." },
    { name: "Product Update", tag: "News", body: "Check out the latest features we've just released..." },
    { name: "Black Friday Promo", tag: "Sales", body: "Get 50% off everything this weekend only!" },
    { name: "Feedback Request", tag: "Support", body: "We'd love to hear your thoughts on your recent purchase..." }
];