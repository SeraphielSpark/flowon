// ============================================
// UTILITIES
// ============================================

function cleanN8nValue(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.startsWith('=')) {
        return val.substring(1);
    }
    return val;
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInitials(name) {
    return (name || 'U').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
}

function showMessage(text, type) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `position:fixed; top:20px; right:20px; padding:12px 20px; background:${type==='error'?'#991b1b':'#000'}; color:#fff; border-radius:4px; z-index:3000; animation: fadeIn 0.3s;`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function setButtonLoading(btn, isLoading, text='Loading...') {
    if(!btn) return;
    if(isLoading) {
        btn.dataset.og = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="btn-spinner"></span> ${text}`;
    } else {
        btn.innerHTML = btn.dataset.og || 'Submit';
        btn.disabled = false;
    }
}

function showGlobalLoader(show, text='Loading...') {
    const el = document.getElementById('globalLoader');
    if(el) {
        el.style.display = show ? 'flex' : 'none';
        const txt = document.getElementById('loaderText');
        if(txt) txt.textContent = text;
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

function updateValue(id, val) {
    const el = document.getElementById(id);
    if(el) el.value = val;
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function clearForm() { if(confirm('Reset form?')) document.getElementById('messageForm').reset(); }
function confirmLogout() { if(confirm('Log out?')) { localStorage.removeItem('flowid'); window.location.href='signup.html'; } }

function parseAndFlattenCustomers(input) {
    if (!input) return [];
    if (typeof input === 'string') {
        try { input = JSON.parse(input); } catch (e) { return []; }
    }
    if (!Array.isArray(input)) {
        if (typeof input === 'object' && input !== null) return [input];
        return [];
    }

    let flatList = [];
    input.forEach(item => {
        if (typeof item === 'string') {
            try {
                const parsed = JSON.parse(item);
                if (Array.isArray(parsed)) flatList = flatList.concat(parsed);
                else if (typeof parsed === 'object' && parsed !== null) flatList.push(parsed);
            } catch (e) {}
        } 
        else if (Array.isArray(item)) flatList = flatList.concat(item);
        else if (typeof item === 'object' && item !== null) flatList.push(item);
    });
    return flatList;
}

function normalizeCustomerData(flatList) {
    const seenEmails = new Set();
    const uniqueList = [];

    flatList.forEach(c => {
        if (!c || typeof c !== 'object') return;
        const customer = {
            name: c.name || 'Unknown',
            email: c.email || '',
            phone: c.phone || '',
            company: c.company || '',
            status: c.status || 'Active',
            createdAt: c.createdAt || new Date().toISOString()
        };

        if (customer.email && customer.email.includes('@')) {
            if (!seenEmails.has(customer.email.toLowerCase())) {
                seenEmails.add(customer.email.toLowerCase());
                uniqueList.push(customer);
            }
        } else {
            uniqueList.push(customer); 
        }
    });
    return uniqueList;
}

function safeParseTemplates(input) {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
        try { return JSON.parse(input); } catch(e) { return []; }
    }
    return [];
}