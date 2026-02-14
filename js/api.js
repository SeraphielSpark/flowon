// ============================================
// API CALLS
// ============================================

async function loadUserData() {
  try {
    showGlobalLoader(true, 'Loading Dashboard...');
    
    // 1. Fetch User Data
    const response = await fetch(`${API_BASE_URL}/userdata/${flowId}`);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const userData = await response.json();
    currentUser = userData;

    // 2. Fetch Inbox Data
    await loadInboxMessages();

    // 3. Update UI
    const username = userData.username || userData.email || 'User';
    updateText('userGreeting', username.split(' ')[0]);
    updateText('profileName', username);
    updateText('userInitials', getInitials(username));
    updateValue('settingsName', username);
    updateValue('settingsEmail', userData.email || '');
    
    const rawFlattened = parseAndFlattenCustomers(userData.customers);
    customers = normalizeCustomerData(rawFlattened);
    
    const rawTemplates = safeParseTemplates(userData.templates);
    templates = rawTemplates.length > 0 ? rawTemplates : [...defaultTemplates];

    updateDashboardStats();
    renderCustomerTable();
    renderEmailList();
    renderTemplates();
    renderTemplateSelector();
    renderAnalytics();
    
  } catch (error) {
    console.error('CRITICAL ERROR loading data:', error);
    showMessage('Failed to load data. Please refresh.', 'error');
  } finally {
    showGlobalLoader(false);
  }
}

async function loadInboxMessages() {
    try {
        const res = await fetch(`${API_BASE_URL}/inbox`);
        if (res.ok) {
            inboxMessages = await res.json();
            updateNotificationCount();
            renderInboxList();
        }
    } catch (e) {
        console.error("Failed to load inbox", e);
    }
}

async function sendAutomatedMessages() {
    if(selectedEmails.size === 0) { alert('No recipients selected'); return; }
    const btn = document.getElementById('btnConfirmSend');
    setButtonLoading(btn, true, 'Sending...');
    const payload = {
        userId: flowId,
        campaignName: document.getElementById('campaignName').value,
        recipients: Array.from(selectedEmails),
        subject: document.getElementById('emailSubject').value,
        body: document.getElementById('emailBody').value,
        fromName: document.getElementById('fromName').value,
        fromEmail: document.getElementById('fromEmail').value
    };
    try {
        const res = await fetch(`${API_BASE_URL}/send-automated-messages`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Send failed');
        showMessage(`Sent to ${selectedEmails.size} recipients`, 'success');
        closeModal('previewModal');
        selectedEmails.clear();
        renderEmailList();
    } catch(e) {
        console.error(e);
        showMessage('Failed to send messages', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function saveAllChanges() {
    const btn = document.getElementById('btnSaveChanges');
    if(btn) setButtonLoading(btn, true, 'Saving...');
    try {
        const payload = {
            userId: flowId,
            customers: customers,
            templates: templates
        };
        await fetch(`${API_BASE_URL}/updatecustomers`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        showMessage('Data saved to cloud', 'success');
    } catch(e) {
        console.error(e);
        showMessage('Error saving data', 'error');
    } finally {
        if(btn) setButtonLoading(btn, false);
    }
}

async function deleteCurrentMessage() {
    if (currentMessageIndex === -1) return;
    
    if(!confirm('Delete this message permanently?')) return;

    const msg = inboxMessages[currentMessageIndex];
    
    // 1. Optimistic UI Update
    inboxMessages.splice(currentMessageIndex, 1);
    currentMessageIndex = -1;
    
    // 2. Reset View
    document.getElementById('inboxContent').style.display = 'none';
    document.getElementById('inboxEmptyState').style.display = 'flex';
    if(window.innerWidth <= 768) closeMobileInbox();

    // 3. Render & API Call
    renderInboxList();
    updateNotificationCount();
    
    try {
        await fetch(`${API_BASE_URL}/inbox/${msg.id}`, { method: 'DELETE' });
    } catch (e) {
        console.error("Delete failed on server", e);
        showMessage('Error deleting message on server', 'error');
    }
}