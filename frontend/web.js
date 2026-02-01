const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'POOL_UPDATED') {
        const pool = pools.find(p => p.id === data.poolId);
        if (pool) {
            pool.current_amount = data.newTotal;
            searchPools(); 
        }
    }
};

let currentUser = {
    id: 'guest_user',
    name: 'Guest User',
    wallet: 5000,
    joinedPools: []
};

let currentCategory = null;
let currentPool = null;


let countdownTimer = null;




const samplePools = [
    {
        id: 1,
        name: "Flipkart Big Sale Pool",
        storeName: "Flipkart",
        category: "shopping",
        description: "Get 20% off on orders above ₹10,000. Great deals on electronics and fashion!",
        targetAmount: 10000,
        currentAmount: 7500,
        ownerName: "Rahul",
        ownerId: "user1",
        members: [
            { id: "user1", name: "Rahul", contribution: 4000, isOwner: true },
            { id: "user2", name: "Priya", contribution: 2000, isOwner: false },
            { id: "user3", name: "Amit", contribution: 1500, isOwner: false }
        ],
        maxMembers: 5,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Mumbai"
    },
    {
        id: 2,
        name: "Amazon Great Indian Sale",
        storeName: "Amazon",
        category: "shopping",
        description: "Flat 25% off on orders above ₹15,000. Pool together for bigger savings!",
        targetAmount: 15000,
        currentAmount: 9000,
        ownerName: "Sneha",
        ownerId: "user4",
        members: [
            { id: "user4", name: "Sneha", contribution: 5000, isOwner: true },
            { id: "user5", name: "Vikram", contribution: 4000, isOwner: false }
        ],
        maxMembers: 6,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Delhi"
    },
    {
        id: 3,
        name: "Mumbai to Pune Cab Share",
        storeName: "Uber",
        category: "travel",
        description: "Share a cab from Mumbai to Pune. Split the fare and save money!",
        targetAmount: 3000,
        currentAmount: 2000,
        ownerName: "Kiran",
        ownerId: "user6",
        members: [
            { id: "user6", name: "Kiran", contribution: 1000, isOwner: true },
            { id: "user7", name: "Meera", contribution: 1000, isOwner: false }
        ],
        maxMembers: 4,
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        pickupLocation: "Mumbai Airport",
        dropLocation: "Pune Station"
    },
    {
        id: 4,
        name: "Swiggy Lunch Pool",
        storeName: "Swiggy",
        category: "food",
        description: "Order worth ₹2000 and get 40% off! Perfect for office lunch.",
        targetAmount: 2000,
        currentAmount: 1400,
        ownerName: "Deepak",
        ownerId: "user8",
        members: [
            { id: "user8", name: "Deepak", contribution: 600, isOwner: true },
            { id: "user9", name: "Nisha", contribution: 400, isOwner: false },
            { id: "user10", name: "Suresh", contribution: 400, isOwner: false }
        ],
        maxMembers: 6,
        deadline: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Chennai"
    },
    {
        id: 5,
        name: "Croma Electronics Deal",
        storeName: "Croma",
        category: "electronics",
        description: "Get 15% off on purchases above ₹20,000. Phones, laptops, TVs!",
        targetAmount: 20000,
        currentAmount: 12000,
        ownerName: "Arjun",
        ownerId: "user11",
        members: [
            { id: "user11", name: "Arjun", contribution: 8000, isOwner: true },
            { id: "user12", name: "Pooja", contribution: 4000, isOwner: false }
        ],
        maxMembers: 4,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: "Bangalore"
    }
];

const sampleCoupons = [
    {
        id: 1,
        store: "Flipkart",
        discount: 20,
        minPurchase: 10000,
        description: "Big Billion Days Special",
        category: "shopping",
        validUntil: "2026-02-15",
        poolers: 12
    },
    {
        id: 2,
        store: "Amazon",
        discount: 25,
        minPurchase: 15000,
        description: "Great Indian Sale Extra Savings",
        category: "shopping",
        validUntil: "2026-02-10",
        poolers: 8
    },
    {
        id: 3,
        store: "Uber",
        discount: 30,
        minPurchase: 2000,
        description: "Long Distance Ride Discount",
        category: "travel",
        validUntil: "2026-02-28",
        poolers: 5
    },
    {
        id: 4,
        store: "Swiggy",
        discount: 40,
        minPurchase: 2000,
        description: "Corporate Lunch Deal",
        category: "food",
        validUntil: "2026-02-05",
        poolers: 15
    },
    {
        id: 5,
        store: "Croma",
        discount: 15,
        minPurchase: 20000,
        description: "Electronics Mega Sale",
        category: "electronics",
        validUntil: "2026-02-25",
        poolers: 6
    }
];


/* ===== INITIALIZATION ===== */

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load pools (use sample if none exist)
    if (!localStorage.getItem('pools')) {
        localStorage.setItem('pools', JSON.stringify(samplePools));
    }
    
    // Load coupons
    if (!localStorage.getItem('coupons')) {
        localStorage.setItem('coupons', JSON.stringify(sampleCoupons));
    }
    
    // Load saved user data (wallet amount, joined pools)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    } else {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    // Set up deposit calculator
    setupDepositCalculator();
}


/* ===== PAGE NAVIGATION ===== */

function enterApp() {
    showPage('dashboard-page');
    updateUserDisplay();
    showToast('Welcome to PoolUp! You have ₹' + currentUser.wallet + ' in wallet.');
}

// Show a specific page
function showPage(pageId) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(function(page) {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Stop countdown timer if running
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
}

// Update user display (name and wallet)
function updateUserDisplay() {
    const nameDisplay = document.getElementById('user-name-display');
    const walletAmount = document.getElementById('wallet-amount');
    
    if (nameDisplay) nameDisplay.textContent = currentUser.name;
    if (walletAmount) walletAmount.textContent = currentUser.wallet.toLocaleString();
}


/* ===== CATEGORY SELECTION ===== */

function selectCategory(category) {
    currentCategory = category;
    
    // Update category title
    const titles = {
        shopping: 'Shopping',
        travel: 'Travel',
        food: 'Food & Dining',
        electronics: 'Electronics'
    };
    
    document.getElementById('category-title').textContent = titles[category] || category;
    
    // Show travel info only for travel category
    const travelInfoBox = document.getElementById('travel-info-box');
    if (category === 'travel') {
        travelInfoBox.classList.remove('hidden');
    } else {
        travelInfoBox.classList.add('hidden');
    }
    
    showPage('category-page');
}


/* ===== CREATE POOL ===== */

function setupDepositCalculator() {
    // Calculator for create pool page
    const contributionInput = document.getElementById('your-contribution');
    if (contributionInput) {
        contributionInput.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const deposit = Math.round(amount * 0.1);
            document.getElementById('deposit-preview').textContent = deposit.toLocaleString();
        });
    }
    
    // Calculator for join pool page
    const joinInput = document.getElementById('join-amount');
    if (joinInput) {
        joinInput.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const deposit = Math.round(amount * 0.1);
            document.getElementById('join-deposit').textContent = deposit.toLocaleString();
        });
    }
}

function showCreatePoolPage() {
    showPage('create-pool-page');
    
    // Show travel fields only for travel category
    const travelFields = document.getElementById('travel-fields');
    if (currentCategory === 'travel') {
        travelFields.classList.remove('hidden');
    } else {
        travelFields.classList.add('hidden');
    }
    
    // Set default deadline (3 days from now)
    const deadlineInput = document.getElementById('deadline');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    deadlineInput.value = defaultDate.toISOString().split('T')[0];
}

function goBackFromCreate() {
    showPage('category-page');
}

function createPool() {
    // Get form values
    const name = document.getElementById('pool-name').value;
    const storeName = document.getElementById('store-name').value;
    const description = document.getElementById('pool-description').value;
    const targetAmount = parseFloat(document.getElementById('target-amount').value);
    const contribution = parseFloat(document.getElementById('your-contribution').value);
    const maxMembers = parseInt(document.getElementById('max-members').value);
    const deadline = document.getElementById('deadline').value;
    
    // Validate
    if (!name || !storeName || !description || !targetAmount || !contribution) {
        showToast('Please fill in all fields');
        return;
    }
    
    // Calculate deposit
    const deposit = Math.round(contribution * 0.1);
    
    // Check wallet
    if (deposit > currentUser.wallet) {
        showToast('Not enough money in wallet');
        return;
    }
    
    // Create pool object
    const newPool = {
        id: Date.now(),
        name: name,
        storeName: storeName,
        category: currentCategory,
        description: description,
        targetAmount: targetAmount,
        currentAmount: contribution,
        ownerName: currentUser.name,
        ownerId: currentUser.id,
        members: [
            {
                id: currentUser.id,
                name: currentUser.name,
                contribution: contribution,
                isOwner: true
            }
        ],
        maxMembers: maxMembers,
        deadline: new Date(deadline).toISOString(),
        location: ''
    };
    
    // Add travel fields if needed
    if (currentCategory === 'travel') {
        newPool.pickupLocation = document.getElementById('pickup-location').value;
        newPool.dropLocation = document.getElementById('drop-location').value;
    }
    
    // Save pool
    const pools = JSON.parse(localStorage.getItem('pools')) || [];
    pools.push(newPool);
    localStorage.setItem('pools', JSON.stringify(pools));
    
    // Update wallet
    currentUser.wallet -= deposit;
    currentUser.joinedPools.push(newPool.id);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserDisplay();
    
    // Show success
    showPopup('Pool Created!', 'Your pool "' + name + '" is live! ₹' + deposit + ' deposit paid.');
    
    // Clear form
    document.getElementById('pool-name').value = '';
    document.getElementById('store-name').value = '';
    document.getElementById('pool-description').value = '';
    document.getElementById('target-amount').value = '';
    document.getElementById('your-contribution').value = '';
    document.getElementById('deposit-preview').textContent = '0';
    
    // Go to browse after delay
    setTimeout(function() {
        closePopup();
        showBrowsePoolsPage();
    }, 2000);
}


/* ===== BROWSE POOLS ===== */

function showBrowsePoolsPage() {
    showPage('browse-pools-page');
    searchPools();
}

function goBackFromBrowse() {
    showPage('category-page');
}

function searchPools() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;
    
    // Get all pools
    const allPools = JSON.parse(localStorage.getItem('pools')) || [];
    
    // Filter by category
    let filtered = allPools.filter(function(pool) {
        return pool.category === currentCategory;
    });
    
    // Filter by search
    if (searchText) {
        filtered = filtered.filter(function(pool) {
            return pool.name.toLowerCase().includes(searchText) ||
                   pool.storeName.toLowerCase().includes(searchText) ||
                   pool.description.toLowerCase().includes(searchText);
        });
    }
    
    // Sort
    if (sortBy === 'deadline') {
        filtered.sort(function(a, b) {
            return new Date(a.deadline) - new Date(b.deadline);
        });
    } else if (sortBy === 'progress') {
        filtered.sort(function(a, b) {
            return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
        });
    } else if (sortBy === 'amount') {
        filtered.sort(function(a, b) {
            return a.targetAmount - b.targetAmount;
        });
    }
    
    // Display
    displayPools(filtered);
}

function displayPools(pools) {
    const container = document.getElementById('pools-list');
    
    if (pools.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-search" style="font-size: 50px; margin-bottom: 20px;"></i>
                <h3>No pools found</h3>
                <p>Try a different search or create a new pool!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    pools.forEach(function(pool) {
        const progress = Math.round((pool.currentAmount / pool.targetAmount) * 100);
        const timeLeft = getTimeLeft(pool.deadline);
        
        html += `
            <div class="pool-card" onclick="viewPoolDetails(${pool.id})">
                <div class="pool-card-header">
                    <span class="store-tag">${pool.storeName}</span>
                    <span class="category-tag">${pool.category.toUpperCase()}</span>
                </div>
                <h3>${pool.name}</h3>
                <p>${pool.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="progress-info">
                    <span>₹${pool.currentAmount.toLocaleString()} / ₹${pool.targetAmount.toLocaleString()}</span>
                    <span>${progress}%</span>
                </div>
                <div class="pool-card-footer">
                    <span><i class="fas fa-users"></i> ${pool.members.length}/${pool.maxMembers} members</span>
                    <span class="time-left"><i class="fas fa-clock"></i> ${timeLeft}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getTimeLeft(deadlineString) {
    const now = new Date();
    const deadline = new Date(deadlineString);
    const diff = deadline - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return days + 'd ' + hours + 'h left';
    } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours + 'h ' + mins + 'm left';
    }
}


/* ===== POOL DETAILS ===== */

function viewPoolDetails(poolId) {
    const pools = JSON.parse(localStorage.getItem('pools')) || [];
    const pool = pools.find(function(p) {
        return p.id === poolId;
    });
    
    if (!pool) {
        showToast('Pool not found');
        return;
    }
    
    currentPool = pool;
    
    // Fill details
    document.getElementById('detail-store').textContent = pool.storeName;
    document.getElementById('detail-category').textContent = pool.category.toUpperCase();
    document.getElementById('detail-name').textContent = pool.name;
    document.getElementById('detail-description').textContent = pool.description;
    
    // Progress
    const progress = Math.round((pool.currentAmount / pool.targetAmount) * 100);
    document.getElementById('detail-progress').style.width = Math.min(progress, 100) + '%';
    document.getElementById('detail-current').textContent = pool.currentAmount.toLocaleString();
    document.getElementById('detail-target').textContent = pool.targetAmount.toLocaleString();
    document.getElementById('detail-percent').textContent = progress + '%';
    
    // Members
    document.getElementById('member-count').textContent = pool.members.length;
    document.getElementById('max-count').textContent = pool.maxMembers;
    displayMembers(pool.members);
    
    // Travel route
    const routeInfo = document.getElementById('route-info');
    if (pool.category === 'travel' && pool.pickupLocation) {
        routeInfo.classList.remove('hidden');
        document.getElementById('detail-pickup').textContent = pool.pickupLocation;
        document.getElementById('detail-drop').textContent = pool.dropLocation;
    } else {
        routeInfo.classList.add('hidden');
    }
    
    // Check if already joined
    const isJoined = pool.members.some(function(m) {
        return m.id === currentUser.id;
    });
    
    const joinSection = document.getElementById('join-section');
    const alreadyJoined = document.getElementById('already-joined');
    
    if (isJoined) {
        joinSection.classList.add('hidden');
        alreadyJoined.classList.remove('hidden');
    } else {
        joinSection.classList.remove('hidden');
        alreadyJoined.classList.add('hidden');
    }
    
    showPage('pool-details-page');
    startCountdown(pool.deadline);
}

function displayMembers(members) {
    const container = document.getElementById('members-list');
    
    let html = '';
    members.forEach(function(member) {
        const initial = member.name.charAt(0).toUpperCase();
        html += `
            <div class="member-item">
                <div class="member-avatar">${initial}</div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-contribution">₹${member.contribution.toLocaleString()}</div>
                </div>
                ${member.isOwner ? '<span class="owner-badge">Owner</span>' : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function startCountdown(deadlineString) {
    const deadline = new Date(deadlineString);
    
    function update() {
        const now = new Date();
        const diff = deadline - now;
        
        if (diff <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            clearInterval(countdownTimer);
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    update();
    countdownTimer = setInterval(update, 1000);
}

function joinPool() {
    const amount = parseFloat($('join-amount').value);
    
    joinPoolBackend(currentPool.id, amount);

    showToast('Sent join request to server...');
}

function leavePool() {
    if (!currentPool) return;
    
    const pools = JSON.parse(localStorage.getItem('pools')) || [];
    const poolIndex = pools.findIndex(function(p) {
        return p.id === currentPool.id;
    });
    
    if (poolIndex === -1) return;
    
    const pool = pools[poolIndex];
    const memberIndex = pool.members.findIndex(function(m) {
        return m.id === currentUser.id;
    });
    
    if (memberIndex === -1) return;
    
    const member = pool.members[memberIndex];
    
    if (member.isOwner) {
        showToast("Owners can't leave their own pool");
        return;
    }
    
    // Refund deposit
    const deposit = Math.round(member.contribution * 0.1);
    currentUser.wallet += deposit;
    currentUser.joinedPools = currentUser.joinedPools.filter(function(id) {
        return id !== currentPool.id;
    });
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserDisplay();
    
    // Update pool
    pool.members.splice(memberIndex, 1);
    pool.currentAmount -= member.contribution;
    localStorage.setItem('pools', JSON.stringify(pools));
    
    // Refresh
    currentPool = pools[poolIndex];
    viewPoolDetails(currentPool.id);
    
    showToast('Left pool. ₹' + deposit + ' refunded.');
}


/* ===== COUPONS ===== */

function showCouponsPage() {
    showPage('coupons-page');
    displayCoupons();
}

function goBackFromCoupons() {
    showPage('category-page');
}

function displayCoupons() {
    const coupons = JSON.parse(localStorage.getItem('coupons')) || [];
    
    const filtered = coupons.filter(function(coupon) {
        return coupon.category === currentCategory;
    });
    
    const container = document.getElementById('coupons-list');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <i class="fas fa-ticket-alt" style="font-size: 50px; margin-bottom: 20px;"></i>
                <h3>No coupons available</h3>
                <p>Check back later for new offers!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach(function(coupon) {
        html += `
            <div class="coupon-card">
                <div class="coupon-top">
                    <div class="coupon-discount">
                        <span class="percent">${coupon.discount}%</span>
                        <span class="off">OFF</span>
                    </div>
                    <div class="coupon-info">
                        <h3>${coupon.store}</h3>
                        <p>${coupon.description}</p>
                        <div class="coupon-meta">
                            <span><i class="fas fa-rupee-sign"></i> Min ₹${coupon.minPurchase.toLocaleString()}</span>
                            <span><i class="fas fa-calendar"></i> Until ${coupon.validUntil}</span>
                        </div>
                    </div>
                </div>
                <div class="coupon-bottom">
                    <span class="poolers"><i class="fas fa-users"></i> ${coupon.poolers} people pooling</span>
                    <button class="btn btn-primary btn-small" onclick="createPoolFromCoupon(${coupon.id})">
                        Start Pool
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function createPoolFromCoupon(couponId) {
    const coupons = JSON.parse(localStorage.getItem('coupons')) || [];
    const coupon = coupons.find(function(c) {
        return c.id === couponId;
    });
    
    if (!coupon) return;
    
    showCreatePoolPage();
    
    // Pre-fill form
    document.getElementById('store-name').value = coupon.store;
    document.getElementById('pool-description').value = coupon.description + ' - ' + coupon.discount + '% off on minimum ₹' + coupon.minPurchase;
    document.getElementById('target-amount').value = coupon.minPurchase;
}


/* ===== HELPER FUNCTIONS ===== */

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

function showPopup(title, message) {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('popup-message').textContent = message;
    document.getElementById('popup').classList.remove('hidden');
}

function closePopup() {
    document.getElementById('popup').classList.add('hidden');
}