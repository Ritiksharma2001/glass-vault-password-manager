   /****************************
     * GlassVault — main script
     ****************************/
   (function(){
    // ---------- State ----------
    let secretKey = null; // derived from entered master password
    let editingIndex = null; // used when editing
    const LS_MASTER = 'glassvault_master';
    const LS_PASSWORDS = 'glassvault_passwords';
    const LS_THEME = 'glassvault_theme';

    // ---------- Elements ----------
    const loginOverlay = document.getElementById('loginOverlay');
    const masterInput = document.getElementById('masterInput');
    const masterSetBtn = document.getElementById('masterSetBtn');
    const masterResetBtn = document.getElementById('masterResetBtn');

    const addBtn = document.getElementById('addBtn');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const mWebsite = document.getElementById('mWebsite');
    const mUsername = document.getElementById('mUsername');
    const mPassword = document.getElementById('mPassword');
    const genBtn = document.getElementById('genBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    const listArea = document.getElementById('listArea');
    const searchInput = document.getElementById('searchInput');

    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('themeLabel');
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');
    const logoutBtn = document.getElementById('logoutBtn');

    // ---------- Utilities ----------
    function readPasswords(){
      try {
        return JSON.parse(localStorage.getItem(LS_PASSWORDS) || '[]');
      } catch(e){
        return [];
      }
    }
    function writePasswords(arr){
      localStorage.setItem(LS_PASSWORDS, JSON.stringify(arr || []));
    }

    function setTheme(theme){
      if(theme === 'light'){
        document.body.classList.remove('theme-dark');
        themeLabel.textContent = 'Light';
      } else {
        document.body.classList.add('theme-dark');
        themeLabel.textContent = 'Dark';
      }
      localStorage.setItem(LS_THEME, theme);
    }

    function loadTheme(){
      const t = localStorage.getItem(LS_THEME) || 'dark';
      setTheme(t);
    }

    function sha256(str){
      return CryptoJS.SHA256(str).toString();
    }

    function encrypt(text, key){
      try {
        return CryptoJS.AES.encrypt(String(text), key).toString();
      } catch(e){ return null; }
    }
    function decrypt(cipher, key){
      try {
        const bytes = CryptoJS.AES.decrypt(cipher, key);
        return bytes.toString(CryptoJS.enc.Utf8);
      } catch(e){ return ''; }
    }

    function generatePassword(length=16){
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]";
      let pw = '';
      for(let i=0;i<length;i++){
        pw += charset.charAt(Math.floor(Math.random()*charset.length));
      }
      return pw;
    }

    // ---------- Login flow ----------
    function ensureMaster(){
      const saved = localStorage.getItem(LS_MASTER);
      if(!saved){
        // first time: show overlay and ask to set
        showLogin();
      } else {
        // ask for password to unlock
        showLogin();
      }
    }

    function showLogin(){
      loginOverlay.style.display = 'flex';
      masterInput.value = '';
      masterInput.focus();
    }
    function hideLogin(){
      loginOverlay.style.display = 'none';
      masterInput.value = '';
    }

    // Set or Login master password
    masterSetBtn.addEventListener('click', () => {
      const v = masterInput.value || '';
      if(!v){
        alert('Please enter a master password.');
        return;
      }

      const saved = localStorage.getItem(LS_MASTER);
      if(!saved){
        // set new master (store SHA256)
        localStorage.setItem(LS_MASTER, sha256(v));
        secretKey = v;
        hideLogin();
        renderList();
        alert('Master password set. Remember this password to access your vault.');
      } else {
        // verify
        if(sha256(v) === saved){
          secretKey = v;
          hideLogin();
          renderList();
        } else {
          alert('Incorrect master password.');
        }
      }
    });

    // Reset all data (clear storage) — careful!
    masterResetBtn.addEventListener('click', () => {
      if(confirm('Delete ALL GlassVault data from this browser? This cannot be undone.')) {
        localStorage.removeItem(LS_MASTER);
        localStorage.removeItem(LS_PASSWORDS);
        location.reload();
      }
    });

    // Logout: clear secretKey (keeps data)
    logoutBtn.addEventListener('click', () => {
      if(!secretKey){
        alert('You are not logged in.');
        return;
      }
      secretKey = null;
      showLogin();
    });

    // ---------- Theme ----------
    themeToggle.addEventListener('click', () => {
      const current = localStorage.getItem(LS_THEME) || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });

    loadTheme();

    // ---------- Modal (Add / Edit) ----------
    addBtn.addEventListener('click', () => {
      editingIndex = null;
      modalTitle.textContent = 'Add Password';
      mWebsite.value = '';
      mUsername.value = '';
      mPassword.value = '';
      openModal();
    });

    function openModal(){ modalBackdrop.style.display = 'flex'; mWebsite.focus(); }
    function closeModal(){ modalBackdrop.style.display = 'none'; editingIndex = null; }

    cancelBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => { if(e.target === modalBackdrop) closeModal(); });

    genBtn.addEventListener('click', () => {
      mPassword.value = generatePassword(16);
    });

    // Save (add or edit)
    saveBtn.addEventListener('click', () => {
      if(!secretKey){
        alert('Unlock first with master password.');
        return;
      }
      const w = mWebsite.value.trim();
      const u = mUsername.value.trim();
      const p = mPassword.value.trim();
      if(!w || !u || !p){ alert('Website, username and password are required.'); return; }

      const enc = encrypt(p, secretKey);
      if(editingIndex === null){
        const arr = readPasswords();
        arr.unshift({ website: w, username: u, password: enc, created: Date.now() });
        writePasswords(arr);
      } else {
        const arr = readPasswords();
        arr[editingIndex] = { ...arr[editingIndex], website: w, username: u, password: enc, updated: Date.now() };
        writePasswords(arr);
      }
      closeModal();
      renderList();
    });

    // ---------- Render list ----------
    function renderList(filter=''){
      listArea.innerHTML = '';
      if(!secretKey) return;

      const arr = readPasswords();
      const q = (filter || '').toLowerCase();

      const filtered = arr.filter(item => {
        return (item.website||'').toLowerCase().includes(q) || (item.username||'').toLowerCase().includes(q);
      });

      if(filtered.length === 0){
        const empty = document.createElement('div');
        empty.className = 'small muted';
        empty.textContent = 'No passwords found. Click Add to create one.';
        listArea.appendChild(empty);
        return;
      }

      filtered.forEach((item, idx) => {
        const i = arr.indexOf(item); // original index
        const card = document.createElement('div');
        card.className = 'card';

        const titleRow = document.createElement('div');
        titleRow.className = 'row';
        const left = document.createElement('div');
        left.innerHTML = `<div class="meta">${escapeHtml(item.website)}</div><div class="sub">${escapeHtml(item.username)}</div>`;
        const controls = document.createElement('div');
        controls.className = 'controls';

        // show / hide button
        const showBtn = document.createElement('button');
        showBtn.className = 'icon-btn';
        showBtn.title = 'Show / Hide password';
        showBtn.innerHTML = svgEye();
        // copy
        const copyBtn = document.createElement('button');
        copyBtn.className = 'icon-btn';
        copyBtn.title = 'Copy password';
        copyBtn.innerHTML = svgCopy();
        // edit
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = svgEdit();
        // delete
        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.title = 'Delete';
        delBtn.innerHTML = svgTrash();

        const pwBox = document.createElement('div');
        pwBox.className = 'pw-text';
        pwBox.textContent = '••••••••••••'; // masked by default

        // append
        controls.appendChild(showBtn);
        controls.appendChild(copyBtn);
        controls.appendChild(editBtn);
        controls.appendChild(delBtn);

        titleRow.appendChild(left);
        titleRow.appendChild(controls);

        card.appendChild(titleRow);
        card.appendChild(pwBox);

        // timestamps
        const metaRow = document.createElement('div');
        metaRow.className = 'small muted';
        const created = item.created ? new Date(item.created).toLocaleString() : '';
        const updated = item.updated ? ' • updated ' + new Date(item.updated).toLocaleString() : '';
        metaRow.textContent = created + (item.updated ? updated : '');
        card.appendChild(metaRow);

        // wire up events
        showBtn.addEventListener('click', () => {
          const current = pwBox.textContent;
          if(current.startsWith('•')){
            // show: decrypt and display
            const dec = decrypt(item.password, secretKey);
            pwBox.textContent = dec || '—';
            showBtn.innerHTML = svgEyeOff();
          } else {
            pwBox.textContent = '••••••••••••';
            showBtn.innerHTML = svgEye();
          }
        });

        copyBtn.addEventListener('click', async () => {
          const dec = decrypt(item.password, secretKey);
          try {
            await navigator.clipboard.writeText(dec || '');
            alert('Password copied to clipboard');
          } catch(e){ alert('Copy failed'); }
        });

        editBtn.addEventListener('click', () => {
          editingIndex = i;
          modalTitle.textContent = 'Edit Password';
          mWebsite.value = item.website;
          mUsername.value = item.username;
          // decrypt to fill password field
          mPassword.value = decrypt(item.password, secretKey) || '';
          openModal();
        });

        delBtn.addEventListener('click', () => {
          if(confirm('Delete this password?')){
            const arr0 = readPasswords();
            arr0.splice(i,1);
            writePasswords(arr0);
            renderList(searchInput.value || '');
          }
        });

        listArea.appendChild(card);
      });
    }

    // Escape helper to avoid HTML injection into textContent usage (we mostly set textContent, but stay safe)
    function escapeHtml(s){
      return (s||'').toString();
    }

    // ---------- Search ----------
    searchInput.addEventListener('input', (e) => {
      renderList(e.target.value);
    });

    // ---------- Export / Import ----------
    exportBtn.addEventListener('click', () => {
      const payload = {
        exportedAt: Date.now(),
        masterHash: localStorage.getItem(LS_MASTER) || null,
        data: readPasswords()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glassvault-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        try {
          const json = JSON.parse(ev.target.result);
          if(!json.data) throw new Error('Invalid backup file.');
          // simple merge: append imported items
          const existing = readPasswords();
          const merged = json.data.concat(existing);
          writePasswords(merged);
          alert('Import successful. Merged entries.');
          renderList();
        } catch(err){
          alert('Import failed: ' + (err.message||err));
        }
      };
      reader.readAsText(file);
      // clear input
      e.target.value = '';
    });

    // ---------- Navigation (stub switching) ----------
    document.getElementById('nav').addEventListener('click', (ev) => {
      const btn = ev.target.closest('button');
      if(!btn) return;
      [...document.querySelectorAll('#nav button')].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // simple section placeholder
      const section = btn.dataset.section;
      if(section !== 'vault'){
        listArea.innerHTML = '<div class="small muted">Section "'+section+'" is a placeholder for future features.</div>';
      } else {
        renderList(searchInput.value || '');
      }
    });

    // ---------- On first load ----------
    function init(){
      // apply theme saved
      loadTheme();

      // show login overlay if no master set or user is locked
      ensureMaster();
    }

    init();

    // SVG helpers
    function svgEye(){ return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="white" stroke-opacity="0.9" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.2" fill="white"/></svg>'; }
    function svgEyeOff(){ return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6 0-10-7-10-7a18.2 18.2 0 0 1 5.11-4.17" stroke="white" stroke-opacity="0.9" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 1l22 22" stroke="white" stroke-opacity="0.9" stroke-width="1.2" stroke-linecap="round"/></svg>'; }
    function svgCopy(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="white" stroke-opacity="0.9" stroke-width="1.1"/><rect x="2" y="2" width="13" height="13" rx="2" stroke="white" stroke-opacity="0.9" stroke-width="1.1"/></svg>'; }
    function svgTrash(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="white" stroke-opacity="0.9" stroke-width="1.2"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="white" stroke-opacity="0.9" stroke-width="1.2" stroke-linecap="round"/></svg>'; }
    function svgEdit(){ return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 21v-3l11-11 3 3L6 21H3z" stroke="white" stroke-opacity="0.9" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

  })();

  document.getElementById("toggleMasterPass").addEventListener("click", function () {
    let passField = document.getElementById("masterPasswordInput");

    if (passField.type === "password") {
        passField.type = "text";
        this.innerText = "🙈"; // Change icon when visible
    } else {
        passField.type = "password";
        this.innerText = "👁️";
    }
});
