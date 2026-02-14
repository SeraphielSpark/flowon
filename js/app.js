// ============================================
// APP LOGIC & EVENTS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  if (!flowId) {
    window.location.href = 'signup.html';
    return;
  }

  // Initial Load
  loadUserData();
  setupEventListeners();
  // Poll for new emails every 10 seconds
  setInterval(loadInboxMessages, 10000);
});

function setupEventListeners() {
  // Toggle Schedule Date visibility
  const scheduleSelect = document.getElementById('scheduleType');
  if(scheduleSelect) {
      scheduleSelect.addEventListener('change', function() {
        const scheduleDateGroup = document.getElementById('scheduleDateGroup');
        scheduleDateGroup.style.display = this.value === 'scheduled' ? 'block' : 'none';
      });
  }
  
  // Message form submission
  const msgForm = document.getElementById('messageForm');
  if(msgForm) {
      msgForm.addEventListener('submit', function(e) {
        e.preventDefault();
        previewMessage();
      });
  }
}

// --- Customer Logic ---
function updateCustomerField(index, field, value) {
  if (!customers[index]) customers[index] = {};
  customers[index][field] = value;
}

async function saveCustomer(index) {
  await saveAllChanges();
}

async function deleteCustomer(index) {
  if (!confirm('Are you sure you want to delete this customer?')) return;
  customers.splice(index, 1);
  refreshUI();
  await saveAllChanges();
}

function addNewCustomer() {
  updateValue('newCustomerName', '');
  updateValue('newCustomerEmail', '');
  updateValue('newCustomerPhone', '');
  updateValue('newCustomerCompany', '');
  updateValue('newCustomerStatus', 'Active');
  openModal('addCustomerModal');
}

async function saveNewCustomer() {
  const btn = document.getElementById('btnSaveCustomer');
  setButtonLoading(btn, true, 'Saving...');
  try {
      const name = document.getElementById('newCustomerName').value.trim();
      if (!name) { alert('Name is required'); setButtonLoading(btn, false); return; }

      const newC = {
          name: name,
          email: document.getElementById('newCustomerEmail').value.trim(),
          phone: document.getElementById('newCustomerPhone').value.trim(),
          company: document.getElementById('newCustomerCompany').value.trim(),
          status: document.getElementById('newCustomerStatus').value,
          createdAt: new Date().toISOString()
      };
      
      customers.push(newC);
      closeModal('addCustomerModal');
      refreshUI();
      await saveAllChanges();
  } catch(e) {
      console.error(e);
  } finally {
      setButtonLoading(btn, false);
  }
}

// --- CSV Import Logic ---
function importCustomers() {
    document.getElementById('csvFileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    showGlobalLoader(true, 'Parsing CSV...');
    const reader = new FileReader();
    reader.onload = function(e) {
        setTimeout(() => processCSV(e.target.result), 100);
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

function processCSV(csvText) {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        showGlobalLoader(false);
        alert('CSV file is too short or empty.');
        return;
    }
    function parseCSVRow(text) {
        const re_value = /(?!\s*$)\s*(?:'([^']*)'|"([^"]*)"|([^,;]*))\s*(?:[,;]|$)/g;
        const row = [];
        text.replace(re_value, (m, p1, p2, p3) => {
            if (p1 !== undefined) row.push(p1);
            else if (p2 !== undefined) row.push(p2);
            else if (p3 !== undefined) row.push(p3);
            return '';
        });
        return row;
    }
    const rawHeaders = parseCSVRow(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().trim());
    let emailIdx = headers.findIndex(h => h === 'email' || h.includes('primary email') || h.includes('email address'));
    let nameIdx = headers.findIndex(h => h === 'name' || h.includes('full name') || h.includes('first name'));
    let companyIdx = headers.findIndex(h => h.includes('company'));
    let phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));

    if (emailIdx === -1 && lines.length > 0) {
        const firstDataRow = parseCSVRow(lines[1]);
        emailIdx = firstDataRow.findIndex(val => val && val.includes('@'));
    }
    if (emailIdx === -1) {
        showGlobalLoader(false);
        alert('Could not detect an Email column. Please check your CSV.');
        return;
    }
    let importedCount = 0;
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVRow(lines[i]);
        if (!row || row.length === 0) continue;
        const email = (row[emailIdx] || '').trim();
        if (email && email.includes('@')) {
            let name = 'Unknown';
            if (nameIdx > -1 && row[nameIdx]) name = row[nameIdx];
            else if (headers.includes('first name')) {
                const fNameIdx = headers.indexOf('first name');
                const lNameIdx = headers.indexOf('last name');
                name = `${row[fNameIdx] || ''} ${row[lNameIdx] || ''}`.trim();
            } else name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            customers.push({
                name: name,
                email: email,
                phone: phoneIdx > -1 ? row[phoneIdx] : '',
                company: companyIdx > -1 ? row[companyIdx] : '',
                status: 'Active',
                createdAt: new Date().toISOString()
            });
            importedCount++;
        }
    }
    refreshUI();
    saveAllChanges().finally(() => {
        showGlobalLoader(false);
        showMessage(`Successfully imported ${importedCount} customers!`, 'success');
    });
}

// --- Automation & Email Selection Logic ---
function toggleEmailSelection(checkbox) {
  const email = checkbox.dataset.email;
  if (checkbox.checked) selectedEmails.add(email);
  else selectedEmails.delete(email);
  updateSelectionCount();
  updateSelectAllCheckbox();
}

function toggleAllEmails() {
  const selectAll = document.getElementById('selectAllEmails');
  const checkboxes = document.querySelectorAll('.email-checkbox');
  if (selectAll.checked) {
    selectedEmails.clear();
    checkboxes.forEach(cb => {
        cb.checked = true;
        selectedEmails.add(cb.dataset.email);
    });
  } else {
    selectedEmails.clear();
    checkboxes.forEach(cb => cb.checked = false);
  }
  updateSelectionCount();
}

function updateSelectionCount() {
  updateText('selectedCount', selectedEmails.size);
}

function updateSelectAllCheckbox() {
  const selectAll = document.getElementById('selectAllEmails');
  const checkboxes = document.querySelectorAll('.email-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  if(selectAll) {
      selectAll.checked = checkedCount === checkboxes.length && checkboxes.length > 0;
      selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
  }
}

// --- Template Logic ---
function createNewTemplate() {
    updateValue('templateIndex', '-1');
    document.getElementById('templateForm').reset();
    updateText('templateModalTitle', 'Add New Template');
    openModal('templateModal');
}

function editTemplate(index) {
    const t = templates[index];
    updateValue('templateIndex', index);
    updateValue('templateName', t.name);
    updateValue('templateTag', t.tag);
    updateValue('templateSubject', t.subject || t.name);
    updateValue('templateBody', t.body);
    updateText('templateModalTitle', 'Edit Template');
    openModal('templateModal');
}

async function saveTemplate() {
    const btn = document.getElementById('btnSaveTemplate');
    setButtonLoading(btn, true);
    const index = parseInt(document.getElementById('templateIndex').value);
    const newT = {
        name: document.getElementById('templateName').value,
        tag: document.getElementById('templateTag').value,
        subject: document.getElementById('templateSubject').value,
        body: document.getElementById('templateBody').value
    };
    if (index === -1) templates.push(newT);
    else templates[index] = newT;
    closeModal('templateModal');
    renderTemplates();
    renderTemplateSelector();
    await saveAllChanges();
    setButtonLoading(btn, false);
}

async function deleteTemplate(index) {
    if(!confirm('Delete template?')) return;
    templates.splice(index, 1);
    renderTemplates();
    renderTemplateSelector();
    await saveAllChanges();
}

function useTemplate(index) {
    loadTemplate(index);
    showSection('automation');
}

function loadTemplate(identifier) {
    document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
    if(identifier === 'custom') {
        updateValue('emailSubject', '');
        updateValue('emailBody', '');
    } else {
        const t = templates[identifier];
        if(t) {
            updateValue('emailSubject', t.subject || t.name);
            updateValue('emailBody', t.body);
        }
    }
}

function previewMessage() {
    const subject = document.getElementById('emailSubject').value;
    const body = document.getElementById('emailBody').value;
    updateText('previewSubject', subject);
    updateText('previewBody', body);
    openModal('previewModal');
}

function refreshUI() {
    updateDashboardStats();
    renderCustomerTable();
    renderEmailList();
}

function refreshData() {
    const btn = document.getElementById('btnRefresh');
    setButtonLoading(btn, true, 'Refreshing...');
    loadUserData().finally(() => setButtonLoading(btn, false));
}