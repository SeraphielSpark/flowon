// ============================================
// UI RENDERING & COMPONENT LOGIC
// ============================================

function showSection(id) {
    document.querySelectorAll('.section-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const sec = document.getElementById(id+'Section');
    if(sec) sec.style.display = 'block';
    
    const nav = document.querySelector(`a[href="#${id}"]`);
    if(nav) nav.classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'customers': 'Customer Management',
        'inbox': 'Inbox',
        'automation': 'Automation Center',
        'analytics': 'Analytics',
        'templates': 'Templates',
        'settings': 'Settings'
    };
    updateText('pageTitle', titles[id] || 'Dashboard');
}

function updateDashboardStats() {
  const total = customers.length;
  updateText('totalCustomers', total);
  updateText('totalEmails', total); 
  updateText('messagesSent', inboxMessages.length > 0 ? inboxMessages.length + 120 : '124'); 
  updateText('activeCampaigns', '2'); 
  updateText('responseRate', '18%'); 
  updateText('customerCount', `(${total})`);
}

function updateNotificationCount() {
    const unread = inboxMessages.filter(m => !m.read).length;
    const badge = document.getElementById('notificationBadge');
    
    badge.textContent = unread;
    if (unread > 0) {
        badge.classList.add('show');
        updateText('unreadStats', unread);
    } else {
        badge.classList.remove('show');
        updateText('unreadStats', 'All caught up');
    }
}

function renderInboxList() {
    const listContainer = document.getElementById('inboxList');
    if (!listContainer) return;

    if (inboxMessages.length === 0) {
        listContainer.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--text-tertiary);">
            <div style="font-size: 24px; margin-bottom: 8px;">📭</div>
            No messages yet
        </div>`;
        return;
    }

    let html = '';
    inboxMessages.forEach((msg, index) => {
        const from = cleanN8nValue(msg.from_name) || cleanN8nValue(msg.from_email) || 'Unknown';
        const subject = cleanN8nValue(msg.subject) || '(No Subject)';
        
        let dateDisplay = 'Today';
        if(msg.date) {
            const d = new Date(cleanN8nValue(msg.date));
            if(!isNaN(d.getTime())) dateDisplay = d.toLocaleDateString();
        }

        const rawBody = cleanN8nValue(msg.body_text || '');
        const snippet = rawBody ? rawBody.substring(0, 50) + '...' : 'No preview available';
        
        // Elite: Unread and selection styling
        const isReadClass = msg.read ? '' : 'unread';
        const selectedClass = index === currentMessageIndex ? 'selected' : '';

        html += `
            <div class="inbox-item ${isReadClass} ${selectedClass}" onclick="viewEmail(${index}, this)">
                <div class="inbox-item-header">
                    <span class="inbox-sender">${escapeHtml(from)}</span>
                    <span class="inbox-date">${dateDisplay}</span>
                </div>
                <div class="inbox-subject">${escapeHtml(subject)}</div>
                <div class="inbox-snippet">${escapeHtml(snippet)}</div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

function viewEmail(index, element) {
    const msg = inboxMessages[index];
    if (!msg) return;

    currentMessageIndex = index;

    // Handle Read Status
    if (!msg.read) {
        msg.read = true;
        updateNotificationCount();
        fetch(`${API_BASE_URL}/inbox/read/${msg.id}`, { method: 'POST' }).catch(e=>console.log(e));
    }
    
    renderInboxList();

    // Update View
    document.getElementById('inboxEmptyState').style.display = 'none';
    
    // Ensure inboxContent is flex to support new layout
    const content = document.getElementById('inboxContent');
    content.style.display = 'flex'; 

    const fromName = cleanN8nValue(msg.from_name) || 'Unknown';
    const fromEmail = cleanN8nValue(msg.from_email);
    const subject = cleanN8nValue(msg.subject) || '(No Subject)';
    let dateStr = 'Unknown Date';
    
    if (msg.date) {
         const d = new Date(cleanN8nValue(msg.date));
         if(!isNaN(d.getTime())) dateStr = d.toLocaleString();
    }

    updateText('viewSubject', subject);
    updateText('viewSender', fromName);
    updateText('viewEmail', fromEmail);
    updateText('viewDate', dateStr);
    updateText('viewAvatar', getInitials(fromName));

    // Handle HTML Body safely
    const bodyContainer = document.getElementById('viewBody');
    const htmlContent = cleanN8nValue(msg.body_html);
    const textContent = cleanN8nValue(msg.body_text);
    
    bodyContainer.innerHTML = htmlContent || textContent || '<p>No content</p>';
    
    // Mobile handling
    if(window.innerWidth <= 768) {
        document.getElementById('inboxView').classList.add('active');
    }
}

function closeMobileInbox() {
    document.getElementById('inboxView').classList.remove('active');
    currentMessageIndex = -1;
    renderInboxList();
}

function renderCustomerTable() {
  const container = document.getElementById('tableContainer');
  if (!container) return;
  if (customers.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h3 style="margin-top:0;">No Customers Yet</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Start by adding or importing customers.</p>
        <button class="btn btn-primary" onclick="addNewCustomer()">Add First Customer</button>
      </div>`;
    return;
  }
  let html = `
    <table class="simple-table">
      <thead>
        <tr>
          <th width="40">#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Company</th>
          <th>Status</th>
          <th width="100">Actions</th>
        </tr>
      </thead>
      <tbody>`;
  customers.forEach((c, i) => {
    const status = c.status || 'Active';
    html += `
      <tr>
        <td style="color: var(--text-tertiary);">${i + 1}</td>
        <td><input class="table-input" value="${escapeHtml(c.name)}" onchange="updateCustomerField(${i}, 'name', this.value)"></td>
        <td><input class="table-input" value="${escapeHtml(c.email)}" onchange="updateCustomerField(${i}, 'email', this.value)"></td>
        <td><input class="table-input" value="${escapeHtml(c.phone)}" onchange="updateCustomerField(${i}, 'phone', this.value)"></td>
        <td><input class="table-input" value="${escapeHtml(c.company)}" onchange="updateCustomerField(${i}, 'company', this.value)"></td>
        <td>
          <select class="table-input email-status status-${status.toLowerCase()}" style="width: auto;" onchange="updateCustomerField(${i}, 'status', this.value)">
            <option value="Active" ${status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
          </select>
        </td>
        <td style="display: flex; gap: 4px;">
          <button class="icon-btn btn" style="width: 32px; padding: 0;" onclick="saveCustomer(${i})" title="Save">💾</button>
          <button class="icon-btn btn" style="width: 32px; padding: 0; color: var(--color-red-text);" onclick="deleteCustomer(${i})" title="Delete">🗑️</button>
        </td>
      </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function renderEmailList() {
  const container = document.getElementById('emailList');
  if(!container) return;
  const validCustomers = customers.filter(c => c.email && c.email.includes('@'));
  if (validCustomers.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-secondary);"><p>No valid email addresses found.</p></div>`;
    return;
  }
  let html = '';
  validCustomers.forEach((c) => {
    const isSelected = selectedEmails.has(c.email);
    const status = c.status || 'Active';
    html += `
      <div class="email-item">
        <input type="checkbox" class="email-checkbox" 
               data-email="${c.email}" 
               ${isSelected ? 'checked' : ''} 
               onchange="toggleEmailSelection(this)">
        <div class="email-info">
          <div class="email-address">${escapeHtml(c.email)}</div>
          <div class="email-customer">${escapeHtml(c.name)} · ${escapeHtml(c.company)}</div>
        </div>
        <div class="email-status status-${status.toLowerCase()}">${status}</div>
      </div>`;
  });
  container.innerHTML = html;
  updateSelectionCount();
}

function renderTemplates() {
    const grid = document.getElementById('templatesGrid');
    if(!grid) return;
    if (templates.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">No templates found.</div>`;
        return;
    }
    let html = '';
    templates.forEach((t, i) => {
        html += `
            <div class="template-card">
                <div class="template-card-header">
                    <span class="template-name">${escapeHtml(t.name)}</span>
                    <span class="template-tag">${escapeHtml(t.tag || 'General')}</span>
                </div>
                <div class="template-body">${escapeHtml(t.body || '')}</div>
                <div class="template-footer">
                    <button class="btn btn-secondary" style="height: 32px; font-size: 13px; flex: 1;" onclick="useTemplate(${i})">Use</button>
                    <button class="btn btn-secondary" style="height: 32px; font-size: 13px;" onclick="editTemplate(${i})">Edit</button>
                    <button class="btn btn-secondary" style="height: 32px; font-size: 13px; color: var(--color-red-text);" onclick="deleteTemplate(${i})">Del</button>
                </div>
            </div>`;
    });
    grid.innerHTML = html;
}

function renderTemplateSelector() {
    const container = document.getElementById('automationTemplateSelector');
    if(!container) return;
    let html = '';
    templates.forEach((t, i) => {
        html += `<button class="template-btn" onclick="loadTemplate(${i})">${escapeHtml(t.name)}</button> `;
    });
    html += `<button class="template-btn" onclick="loadTemplate('custom')">Blank</button>`;
    container.innerHTML = html;
}

function renderAnalytics() {
    const container = document.getElementById('analyticsChart');
    if(!container) return;
    const data = [10, 40, 25, 50, 30, 60, 70];
    const max = Math.max(...data);
    container.innerHTML = data.map((d,i) => `
        <div class="chart-bar-group">
            <div class="chart-value">${d}</div>
            <div class="chart-bar" style="height:${(d/max)*100}%"></div>
            <div class="chart-label">Day ${i+1}</div>
        </div>
    `).join('');
}