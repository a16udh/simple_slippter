/**
 * Apple-Style Expense Splitter & Calculator (Smooth Native Edition)
 * - Persistent local storage (history, friends directory, trips, settings)
 * - Debt simplification algorithm (minimal settlements)
 * - Quick bill & tip calculator
 * - Haptic feedback for native Android feel
 * - Export & import database
 */

(function () {
  'use strict';

  // --- Configuration & Constants ---
  const STORAGE_KEY = 'apple_split_app_v2';
  
  const DEFAULT_AVATARS = [
    { bg: '#007aff', label: 'Blue' },
    { bg: '#34c759', label: 'Green' },
    { bg: '#ff9500', label: 'Orange' },
    { bg: '#ff2d55', label: 'Pink' },
    { bg: '#af52de', label: 'Purple' },
    { bg: '#5856d6', label: 'Indigo' },
    { bg: '#00c7be', label: 'Teal' },
    { bg: '#30b0c7', label: 'Cyan' },
  ];

  const CATEGORIES = [
    { id: 'dining', name: 'Dining', emoji: '🍕' },
    { id: 'drinks', name: 'Drinks', emoji: '🍹' },
    { id: 'groceries', name: 'Groceries', emoji: '🛒' },
    { id: 'travel', name: 'Travel', emoji: '🚕' },
    { id: 'stay', name: 'Stay', emoji: '🏨' },
    { id: 'entertainment', name: 'Fun', emoji: '🎟️' },
    { id: 'bills', name: 'Bills', emoji: '⚡' },
    { id: 'other', name: 'Other', emoji: '📦' },
  ];

  // --- Initial Default State ---
  const DEFAULT_STATE = {
    settings: {
      currency: '₹',
      theme: 'auto', // 'light', 'dark', 'auto'
      haptics: true,
    },
    // Global Directory of Friends (Names & Avatars)
    friendsDirectory: [
      { id: 'f_anirudh', name: 'Anirudh', color: '#007aff', note: 'You' },
      { id: 'f_alex', name: 'Alex', color: '#34c759', note: '' },
      { id: 'f_sarah', name: 'Sarah', color: '#af52de', note: '' },
      { id: 'f_rahul', name: 'Rahul', color: '#ff9500', note: '' },
    ],
    activeTripId: 'trip_1',
    trips: [
      {
        id: 'trip_1',
        title: 'Goa Weekend 🌴',
        createdAt: Date.now() - 86400000 * 2,
        members: ['Anirudh', 'Alex', 'Sarah', 'Rahul'],
        expenses: [
          {
            id: 'exp_1',
            desc: 'Beachside Villa Stay',
            amount: 6000,
            paidBy: 'Anirudh',
            category: 'stay',
            splitWith: ['Anirudh', 'Alex', 'Sarah', 'Rahul'],
            splitMode: 'equal',
            date: Date.now() - 86400000 * 2,
          },
          {
            id: 'exp_2',
            desc: 'Seafood Dinner & Drinks',
            amount: 2400,
            paidBy: 'Alex',
            category: 'dining',
            splitWith: ['Anirudh', 'Alex', 'Sarah', 'Rahul'],
            splitMode: 'equal',
            date: Date.now() - 86400000 * 1,
          },
          {
            id: 'exp_3',
            desc: 'Airport Taxi Fare',
            amount: 1200,
            paidBy: 'Sarah',
            category: 'travel',
            splitWith: ['Anirudh', 'Alex', 'Sarah'],
            splitMode: 'equal',
            date: Date.now() - 3600000 * 4,
          }
        ],
        settlementHistory: []
      },
      {
        id: 'trip_2',
        title: 'Apartment Groceries 🛒',
        createdAt: Date.now() - 86400000 * 10,
        members: ['Anirudh', 'Rahul'],
        expenses: [
          {
            id: 'exp_4',
            desc: 'Supermarket Weekly Restock',
            amount: 1450,
            paidBy: 'Rahul',
            category: 'groceries',
            splitWith: ['Anirudh', 'Rahul'],
            splitMode: 'equal',
            date: Date.now() - 86400000 * 3,
          }
        ],
        settlementHistory: []
      }
    ],
    // Quick Split Calculator State
    quickSplit: {
      billAmount: 1800,
      tipPercent: 10,
      customTip: 0,
      peopleCount: 3,
      taxPercent: 5,
      rounding: 'none',
      note: 'Dinner with team'
    }
  };

  // --- Application State Manager ---
  let state = loadInitialState();

  function loadInitialState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load local state:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  // --- Haptic Feedback ---
  function triggerHaptic(style = 'light') {
    if (!state.settings.haptics || !navigator.vibrate) return;
    if (style === 'light') navigator.vibrate(10);
    else if (style === 'medium') navigator.vibrate(22);
    else if (style === 'success') navigator.vibrate([15, 40, 20]);
  }

  // --- Utility Helpers ---
  function getActiveTrip() {
    let trip = state.trips.find(t => t.id === state.activeTripId);
    if (!trip && state.trips.length > 0) {
      state.activeTripId = state.trips[0].id;
      trip = state.trips[0];
    }
    return trip;
  }

  function formatMoney(num) {
    const sym = state.settings.currency || '₹';
    return `${sym}${Number(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getAvatarColorForName(name) {
    const friend = state.friendsDirectory.find(f => f.name.toLowerCase() === (name || '').toLowerCase());
    if (friend && friend.color) return friend.color;
    
    // Hash-based consistent color fallback
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % DEFAULT_AVATARS.length;
    return DEFAULT_AVATARS[idx].bg;
  }

  function showToast(message, icon = '✓') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  // --- Settlement Debt Minimization Algorithm ---
  function computeBalancesAndSettlements(trip) {
    if (!trip || !trip.expenses || trip.expenses.length === 0) {
      return { balances: {}, settlements: [], totalSpend: 0 };
    }

    const balances = {};
    trip.members.forEach(m => { balances[m] = 0; });
    let totalSpend = 0;

    trip.expenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalSpend += amt;
      const payer = exp.paidBy;
      if (balances[payer] === undefined) balances[payer] = 0;
      balances[payer] += amt;

      const splitWith = exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : trip.members;
      const splitMode = exp.splitMode || 'equal';

      if (splitMode === 'equal') {
        const share = amt / splitWith.length;
        splitWith.forEach(m => {
          if (balances[m] === undefined) balances[m] = 0;
          balances[m] -= share;
        });
      } else if (exp.customShares) {
        Object.keys(exp.customShares).forEach(m => {
          const share = Number(exp.customShares[m]) || 0;
          if (balances[m] === undefined) balances[m] = 0;
          balances[m] -= share;
        });
      }
    });

    // Account for settled debts
    if (trip.settlementHistory && trip.settlementHistory.length > 0) {
      trip.settlementHistory.forEach(s => {
        if (balances[s.from] !== undefined) balances[s.from] += s.amount;
        if (balances[s.to] !== undefined) balances[s.to] -= s.amount;
      });
    }

    // Debt Simplification (Minimizing transactions)
    const debtors = [];
    const creditors = [];

    Object.keys(balances).forEach(person => {
      const net = Math.round(balances[person] * 100) / 100;
      if (net < -0.01) debtors.push({ person, amount: -net });
      else if (net > 0.01) creditors.push({ person, amount: net });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      if (settledAmount > 0.01) {
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount: settledAmount,
        });
      }

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { balances, settlements, totalSpend };
  }

  // --- UI Renderers ---

  // 1. Header & Theme
  function applyTheme() {
    const theme = state.settings.theme;
    const body = document.documentElement;
    if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
      document.getElementById('themeToggleBtn').innerHTML = '☀️';
    } else if (theme === 'light') {
      body.removeAttribute('data-theme');
      document.getElementById('themeToggleBtn').innerHTML = '🌙';
    } else {
      // Auto
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) body.setAttribute('data-theme', 'dark');
      else body.removeAttribute('data-theme');
      document.getElementById('themeToggleBtn').innerHTML = prefersDark ? '☀️' : '🌙';
    }
  }

  function renderCurrencies() {
    const chips = document.querySelectorAll('.currency-chip');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.curr === state.settings.currency);
    });
  }

  // 2. Trip Navigation Tabs
  function renderTripTabs() {
    const container = document.getElementById('tripTabsContainer');
    if (!container) return;
    container.innerHTML = '';

    state.trips.forEach(trip => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `trip-pill ${trip.id === state.activeTripId ? 'active' : ''}`;
      pill.innerHTML = `<span>${trip.title}</span>`;
      pill.onclick = () => {
        triggerHaptic('light');
        state.activeTripId = trip.id;
        saveState();
        renderActiveView();
      };
      container.appendChild(pill);
    });

    const addTripBtn = document.createElement('button');
    addTripBtn.type = 'button';
    addTripBtn.className = 'trip-pill';
    addTripBtn.innerHTML = '<span>+ New Trip</span>';
    addTripBtn.onclick = () => {
      triggerHaptic('light');
      openModal('newTripModal');
    };
    container.appendChild(addTripBtn);
  }

  // 3. Hero Summary Card
  function renderHeroCard() {
    const trip = getActiveTrip();
    const heroTitle = document.getElementById('heroTripTitle');
    const heroCurrency = document.getElementById('heroCurrencySymbol');
    const heroAmount = document.getElementById('heroTotalSpend');
    const heroMemberCount = document.getElementById('heroMemberCount');

    if (!trip) {
      if (heroAmount) heroAmount.textContent = '0.00';
      return;
    }

    const { totalSpend } = computeBalancesAndSettlements(trip);
    if (heroTitle) heroTitle.textContent = `${trip.title} · Total Spend`;
    if (heroCurrency) heroCurrency.textContent = state.settings.currency;
    if (heroAmount) heroAmount.textContent = Number(totalSpend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (heroMemberCount) heroMemberCount.textContent = `${trip.members.length} friends`;
  }

  // 4. Trip Members
  function renderTripMembers() {
    const trip = getActiveTrip();
    const container = document.getElementById('tripMembersContainer');
    if (!container || !trip) return;
    container.innerHTML = '';

    trip.members.forEach(member => {
      const chip = document.createElement('div');
      chip.className = 'member-chip';
      const color = getAvatarColorForName(member);
      chip.innerHTML = `
        <div class="avatar-circle" style="background-color: ${color}">${member.charAt(0)}</div>
        <span>${member}</span>
        <button type="button" class="member-remove-btn" title="Remove" data-name="${member}">✕</button>
      `;
      chip.querySelector('.member-remove-btn').onclick = (e) => {
        e.stopPropagation();
        triggerHaptic('medium');
        removeMemberFromTrip(member);
      };
      container.appendChild(chip);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'member-chip';
    addBtn.style.borderStyle = 'dashed';
    addBtn.innerHTML = '<span>+ Add Friend</span>';
    addBtn.onclick = () => {
      triggerHaptic('light');
      openAddFriendModal();
    };
    container.appendChild(addBtn);
  }

  function removeMemberFromTrip(name) {
    const trip = getActiveTrip();
    if (!trip || trip.members.length <= 1) {
      showToast('Need at least 1 member in trip', '⚠️');
      return;
    }
    // Check if member has expenses
    const hasExpenses = trip.expenses.some(e => e.paidBy === name || (e.splitWith && e.splitWith.includes(name)));
    if (hasExpenses) {
      if (!confirm(`"${name}" is part of existing expenses in this trip. Remove anyway?`)) return;
    }
    trip.members = trip.members.filter(m => m !== name);
    saveState();
    renderActiveView();
    showToast(`Removed ${name}`);
  }

  // 5. Who Owes Whom (Settlements)
  function renderSettlements() {
    const trip = getActiveTrip();
    const container = document.getElementById('settlementsListContainer');
    if (!container || !trip) return;
    container.innerHTML = '';

    const { settlements, balances } = computeBalancesAndSettlements(trip);

    if (settlements.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <div class="empty-title">All Settled Up!</div>
          <div class="empty-text">No one owes anything in this trip.</div>
        </div>
      `;
      return;
    }

    settlements.forEach(item => {
      const card = document.createElement('div');
      card.className = 'settlement-card';
      const fromColor = getAvatarColorForName(item.from);
      const toColor = getAvatarColorForName(item.to);

      card.innerHTML = `
        <div class="settlement-payer">
          <div class="avatar-circle" style="background-color: ${fromColor}">${item.from.charAt(0)}</div>
          <strong>${item.from}</strong>
          <span class="settlement-arrow">➔</span>
          <div class="avatar-circle" style="background-color: ${toColor}">${item.to.charAt(0)}</div>
          <strong>${item.to}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="settlement-amount">${formatMoney(item.amount)}</span>
          <button type="button" class="settle-btn" data-from="${item.from}" data-to="${item.to}" data-amount="${item.amount}">
            Settle ✓
          </button>
        </div>
      `;

      card.querySelector('.settle-btn').onclick = () => {
        triggerHaptic('success');
        recordSettlement(item.from, item.to, item.amount);
      };

      container.appendChild(card);
    });
  }

  function recordSettlement(from, to, amount) {
    const trip = getActiveTrip();
    if (!trip) return;
    if (!trip.settlementHistory) trip.settlementHistory = [];
    trip.settlementHistory.push({
      id: 'settle_' + Date.now(),
      from,
      to,
      amount: Number(amount),
      date: Date.now()
    });
    saveState();
    renderActiveView();
    showToast(`${from} paid ${to} ${formatMoney(amount)}!`, '✓');
  }

  // 6. Expense History List
  function renderExpenseHistory() {
    const trip = getActiveTrip();
    const container = document.getElementById('expenseHistoryContainer');
    const searchInput = document.getElementById('expenseSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (!container || !trip) return;
    container.innerHTML = '';

    let list = (trip.expenses || []).slice().reverse();
    if (query) {
      list = list.filter(e => e.desc.toLowerCase().includes(query) || e.paidBy.toLowerCase().includes(query));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🧾</div>
          <div class="empty-title">No Expenses Yet</div>
          <div class="empty-text">Tap the "+" button below to add your first expense.</div>
        </div>
      `;
      return;
    }

    list.forEach(exp => {
      const cat = CATEGORIES.find(c => c.id === exp.category) || { name: 'Other', emoji: '📦' };
      const item = document.createElement('div');
      item.className = 'expense-item';
      
      const dateStr = new Date(exp.date || Date.now()).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });

      item.innerHTML = `
        <div class="expense-item-left">
          <div class="expense-icon-badge">${cat.emoji}</div>
          <div class="expense-item-details">
            <div class="expense-item-title">${exp.desc || 'Expense'}</div>
            <div class="expense-item-sub">
              <span>Paid by <strong>${exp.paidBy}</strong></span> · <span>${dateStr}</span>
            </div>
          </div>
        </div>
        <div class="expense-item-right">
          <span class="expense-amount-tag">${formatMoney(exp.amount)}</span>
          <button type="button" class="expense-delete-btn" data-id="${exp.id}" title="Delete">Delete</button>
        </div>
      `;

      item.querySelector('.expense-delete-btn').onclick = () => {
        triggerHaptic('medium');
        deleteExpense(exp.id);
      };

      container.appendChild(item);
    });
  }

  function deleteExpense(expId) {
    const trip = getActiveTrip();
    if (!trip) return;
    trip.expenses = trip.expenses.filter(e => e.id !== expId);
    saveState();
    renderActiveView();
    showToast('Expense removed', '🗑️');
  }

  // 7. Quick Bill Split Calculator Tab
  function renderQuickCalculator() {
    const q = state.quickSplit;
    const billInput = document.getElementById('quickBillInput');
    const tipDisplay = document.getElementById('quickTipDisplay');
    const splitCountDisplay = document.getElementById('quickSplitCount');
    const perPersonDisplay = document.getElementById('quickPerPersonDisplay');
    const subtotalDisplay = document.getElementById('quickSubtotalDisplay');
    const taxTipDisplay = document.getElementById('quickTaxTipDisplay');

    if (billInput && document.activeElement !== billInput) {
      billInput.value = q.billAmount || '';
    }

    const bill = Number(q.billAmount) || 0;
    const tipRate = (Number(q.tipPercent) || 0) / 100;
    const taxRate = (Number(q.taxPercent) || 0) / 100;
    const people = Math.max(1, Number(q.peopleCount) || 1);

    const tipAmt = bill * tipRate;
    const taxAmt = bill * taxRate;
    let total = bill + tipAmt + taxAmt;

    if (q.rounding === 'round') total = Math.ceil(total);
    else if (q.rounding === 'person') total = Math.ceil(total / people) * people;

    const perPerson = total / people;

    if (perPersonDisplay) perPersonDisplay.textContent = Number(perPerson).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (subtotalDisplay) subtotalDisplay.textContent = formatMoney(bill);
    if (taxTipDisplay) taxTipDisplay.textContent = formatMoney(tipAmt + taxAmt);
    if (splitCountDisplay) splitCountDisplay.textContent = people;

    // Highlight tip chips
    document.querySelectorAll('.tip-chip').forEach(btn => {
      const tipVal = Number(btn.dataset.tip);
      btn.classList.toggle('active', tipVal === q.tipPercent);
    });
  }

  // 8. Friends Directory Tab
  function renderFriendsDirectory() {
    const container = document.getElementById('friendsDirectoryList');
    if (!container) return;
    container.innerHTML = '';

    if (state.friendsDirectory.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-title">No Friends Saved</div>
          <div class="empty-text">Add friends you frequently share bills with.</div>
        </div>
      `;
      return;
    }

    state.friendsDirectory.forEach(friend => {
      const card = document.createElement('div');
      card.className = 'settlement-card';
      card.innerHTML = `
        <div class="settlement-payer">
          <div class="avatar-circle" style="background-color: ${friend.color || '#007aff'}">${friend.name.charAt(0)}</div>
          <div>
            <div style="font-weight: 600;">${friend.name}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${friend.note || 'Saved contact'}</div>
          </div>
        </div>
        <button type="button" class="expense-delete-btn" data-id="${friend.id}">Remove</button>
      `;

      card.querySelector('.expense-delete-btn').onclick = () => {
        triggerHaptic('medium');
        state.friendsDirectory = state.friendsDirectory.filter(f => f.id !== friend.id);
        saveState();
        renderFriendsDirectory();
        showToast(`Removed ${friend.name}`);
      };

      container.appendChild(card);
    });
  }

  // --- Modal Controllers ---
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  function initModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.getAttribute('data-close-modal');
        closeModal(targetId);
      };
    });
  }

  // --- Add Expense Modal Setup ---
  let selectedExpenseCategory = 'dining';

  function openAddExpenseModal() {
    const trip = getActiveTrip();
    if (!trip) {
      showToast('Create a trip first!', '⚠️');
      return;
    }

    const payerSelect = document.getElementById('expensePayerSelect');
    if (payerSelect) {
      payerSelect.innerHTML = trip.members.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    // Category Buttons
    const catContainer = document.getElementById('expenseCategoryScroller');
    if (catContainer) {
      catContainer.innerHTML = '';
      CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `category-btn ${cat.id === selectedExpenseCategory ? 'active' : ''}`;
        btn.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span>${cat.name}</span>`;
        btn.onclick = () => {
          triggerHaptic('light');
          selectedExpenseCategory = cat.id;
          document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
        catContainer.appendChild(btn);
      });
    }

    // Split with checklist
    const splitContainer = document.getElementById('expenseSplitWithContainer');
    if (splitContainer) {
      splitContainer.innerHTML = trip.members.map(m => `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
          <input type="checkbox" name="splitMember" value="${m}" checked style="accent-color: var(--accent); width: 18px; height: 18px;" />
          <span>${m}</span>
        </label>
      `).join('');
    }

    // Reset inputs
    document.getElementById('expenseAmountInput').value = '';
    document.getElementById('expenseDescInput').value = '';

    openModal('addExpenseModal');
  }

  function handleSaveExpense(e) {
    e.preventDefault();
    const trip = getActiveTrip();
    if (!trip) return;

    const amount = parseFloat(document.getElementById('expenseAmountInput').value);
    const desc = document.getElementById('expenseDescInput').value.trim() || 'Expense';
    const payer = document.getElementById('expensePayerSelect').value;

    if (!amount || isNaN(amount) || amount <= 0) {
      showToast('Enter a valid amount', '⚠️');
      return;
    }

    const splitCheckboxes = document.querySelectorAll('input[name="splitMember"]:checked');
    const splitWith = Array.from(splitCheckboxes).map(cb => cb.value);

    if (splitWith.length === 0) {
      showToast('Select at least one person to split with', '⚠️');
      return;
    }

    const newExpense = {
      id: 'exp_' + Date.now(),
      desc,
      amount,
      paidBy: payer,
      category: selectedExpenseCategory,
      splitWith,
      splitMode: 'equal',
      date: Date.now()
    };

    trip.expenses.push(newExpense);
    saveState();
    closeModal('addExpenseModal');
    triggerHaptic('success');
    renderActiveView();
    showToast(`Added ${desc} (${formatMoney(amount)})`, '✓');
  }

  // --- Add Friend Modal Setup ---
  function openAddFriendModal() {
    const dirContainer = document.getElementById('quickFriendPills');
    const trip = getActiveTrip();
    if (dirContainer && trip) {
      const candidates = state.friendsDirectory.filter(f => !trip.members.includes(f.name));
      if (candidates.length > 0) {
        dirContainer.innerHTML = `
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px;">From Saved Friends:</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${candidates.map(c => `
              <button type="button" class="member-chip" data-quick-friend="${c.name}">
                <div class="avatar-circle" style="background-color: ${c.color}">${c.name.charAt(0)}</div>
                <span>+ ${c.name}</span>
              </button>
            `).join('')}
          </div>
        `;
        dirContainer.querySelectorAll('[data-quick-friend]').forEach(btn => {
          btn.onclick = () => {
            const name = btn.getAttribute('data-quick-friend');
            trip.members.push(name);
            saveState();
            closeModal('addFriendModal');
            renderActiveView();
            showToast(`Added ${name} to ${trip.title}`);
          };
        });
      } else {
        dirContainer.innerHTML = '';
      }
    }

    document.getElementById('newFriendNameInput').value = '';
    openModal('addFriendModal');
  }

  function handleSaveFriend(e) {
    e.preventDefault();
    const nameInput = document.getElementById('newFriendNameInput');
    const name = nameInput.value.trim();
    if (!name) return;

    const trip = getActiveTrip();
    if (trip && !trip.members.includes(name)) {
      trip.members.push(name);
    }

    // Also add to global directory if not exists
    if (!state.friendsDirectory.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      const randomColor = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)].bg;
      state.friendsDirectory.push({
        id: 'f_' + Date.now(),
        name,
        color: randomColor,
        note: 'Saved'
      });
    }

    saveState();
    closeModal('addFriendModal');
    triggerHaptic('success');
    renderActiveView();
    showToast(`Added ${name}!`, '✓');
  }

  // --- Add Trip Modal Setup ---
  function handleSaveTrip(e) {
    e.preventDefault();
    const input = document.getElementById('newTripTitleInput');
    const title = input.value.trim();
    if (!title) return;

    // Use current user or directory defaults
    const initialMembers = state.friendsDirectory.slice(0, 3).map(f => f.name);
    if (initialMembers.length === 0) initialMembers.push('You');

    const newTrip = {
      id: 'trip_' + Date.now(),
      title,
      createdAt: Date.now(),
      members: initialMembers,
      expenses: [],
      settlementHistory: []
    };

    state.trips.push(newTrip);
    state.activeTripId = newTrip.id;
    saveState();
    closeModal('newTripModal');
    triggerHaptic('success');
    renderActiveView();
    showToast(`Created "${title}"!`, '🎉');
  }

  // --- Export & Backup ---
  function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `apple_split_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported backup JSON!', '📁');
  }

  function exportTripCsv() {
    const trip = getActiveTrip();
    if (!trip || !trip.expenses || trip.expenses.length === 0) {
      showToast('No expenses to export', '⚠️');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Date,Description,Category,Amount,Paid By,Split With\n";
    trip.expenses.forEach(e => {
      const dateStr = new Date(e.date || Date.now()).toISOString().slice(0, 10);
      const splitList = (e.splitWith || []).join(';');
      csvContent += `"${dateStr}","${e.desc}","${e.category}","${e.amount}","${e.paidBy}","${splitList}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${trip.title.replace(/[^a-zA-Z0-9]/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Exported trip CSV!', '📊');
  }

  // --- Tab Navigation Controller ---
  let activeViewId = 'groupView';

  function switchTab(viewId) {
    activeViewId = viewId;
    triggerHaptic('light');

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(viewId);
    if (targetSec) targetSec.classList.add('active');

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    const fab = document.getElementById('fabAddExpense');
    if (fab) {
      fab.style.display = (viewId === 'groupView' || viewId === 'historyView') ? 'flex' : 'none';
    }

    renderActiveView();
  }

  function renderActiveView() {
    renderCurrencies();
    renderHeroCard();
    renderTripTabs();

    if (activeViewId === 'groupView') {
      renderTripMembers();
      renderSettlements();
    } else if (activeViewId === 'historyView') {
      renderExpenseHistory();
    } else if (activeViewId === 'quickView') {
      renderQuickCalculator();
    } else if (activeViewId === 'friendsView') {
      renderFriendsDirectory();
    }
  }

  // --- Attach Event Listeners ---
  function initEvents() {
    // Tab switching
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.onclick = () => switchTab(btn.dataset.view);
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.onclick = () => {
        triggerHaptic('light');
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
      };
    }

    // Currency Switcher
    document.querySelectorAll('.currency-chip').forEach(chip => {
      chip.onclick = () => {
        triggerHaptic('light');
        state.settings.currency = chip.dataset.curr;
        saveState();
        renderActiveView();
      };
    });

    // FAB Button
    const fab = document.getElementById('fabAddExpense');
    if (fab) {
      fab.onclick = () => {
        triggerHaptic('light');
        openAddExpenseModal();
      };
    }

    // Forms
    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) addExpenseForm.onsubmit = handleSaveExpense;

    const addFriendForm = document.getElementById('addFriendForm');
    if (addFriendForm) addFriendForm.onsubmit = handleSaveFriend;

    const newTripForm = document.getElementById('newTripForm');
    if (newTripForm) newTripForm.onsubmit = handleSaveTrip;

    // Quick Calculator Inputs
    const quickBill = document.getElementById('quickBillInput');
    if (quickBill) {
      quickBill.oninput = (e) => {
        state.quickSplit.billAmount = parseFloat(e.target.value) || 0;
        saveState();
        renderQuickCalculator();
      };
    }

    document.querySelectorAll('.tip-chip').forEach(btn => {
      btn.onclick = () => {
        triggerHaptic('light');
        state.quickSplit.tipPercent = Number(btn.dataset.tip);
        saveState();
        renderQuickCalculator();
      };
    });

    const splitMinusBtn = document.getElementById('splitMinusBtn');
    if (splitMinusBtn) {
      splitMinusBtn.onclick = () => {
        if (state.quickSplit.peopleCount > 1) {
          triggerHaptic('light');
          state.quickSplit.peopleCount--;
          saveState();
          renderQuickCalculator();
        }
      };
    }

    const splitPlusBtn = document.getElementById('splitPlusBtn');
    if (splitPlusBtn) {
      splitPlusBtn.onclick = () => {
        triggerHaptic('light');
        state.quickSplit.peopleCount++;
        saveState();
        renderQuickCalculator();
      };
    }

    // Search History
    const searchInput = document.getElementById('expenseSearchInput');
    if (searchInput) {
      searchInput.oninput = () => renderExpenseHistory();
    }

    // Export CSV & Backup
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) exportCsvBtn.onclick = exportTripCsv;

    const exportBackupBtn = document.getElementById('exportBackupBtn');
    if (exportBackupBtn) exportBackupBtn.onclick = exportData;

    // Reset Data button
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
      resetDataBtn.onclick = () => {
        if (confirm('Are you sure you want to reset all trips and start fresh?')) {
          state = JSON.parse(JSON.stringify(DEFAULT_STATE));
          saveState();
          renderActiveView();
          showToast('App reset to clean state', '🧹');
        }
      };
    }
  }

  // --- Bootstrap App ---
  function init() {
    applyTheme();
    initModals();
    initEvents();
    renderActiveView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
