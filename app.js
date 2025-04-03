/**
 * Milk Tracker Application
 * A mobile app to track daily milk input, calculate financial metrics,
 * and generate reports.
 */

// Initialize DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initApp();
});

/**
 * Initialize the application
 */
function initApp() {
    // Set current date and time
    setCurrentDateTime();
    
    // Load saved data
    loadData();
    
    // Set up tab navigation
    setupTabs();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update all UI elements with current data
    updateUI();
}

// ========== DATA MANAGEMENT ==========

/**
 * Application state
 */
const appState = {
    entries: [], // Milk entries
    settings: {
        milkPrice: 0,
        cloudBackupEnabled: false,
        lastBackupDate: null
    }
};

/**
 * Load data from local storage
 */
function loadData() {
    try {
        const savedData = localStorage.getItem('milkTrackerData');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Restore entries with proper Date objects
            if (parsedData.entries) {
                appState.entries = parsedData.entries.map(entry => ({
                    ...entry,
                    date: new Date(entry.date)
                }));
            }
            
            // Restore settings
            if (parsedData.settings) {
                appState.settings = {
                    ...appState.settings,
                    ...parsedData.settings
                };
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Αποτυχία φόρτωσης αποθηκευμένων δεδομένων');
    }
}

/**
 * Save data to local storage
 */
function saveData() {
    try {
        localStorage.setItem('milkTrackerData', JSON.stringify(appState));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Αποτυχία αποθήκευσης δεδομένων');
        return false;
    }
}

/**
 * Add a new milk entry
 * @param {Object} entry - The milk entry to add
 */
function addEntry(entry) {
    // Generate unique ID
    entry.id = Date.now().toString();
    
    // Add entry to state
    appState.entries.unshift(entry);
    
    // Save data
    if (saveData()) {
        updateUI();
        showToast('Η εγγραφή αποθηκεύτηκε με επιτυχία');
        
        // Clear input fields
        document.getElementById('milk-quantity').value = '';
        setCurrentDateTime();
    }
}

/**
 * Delete a milk entry
 * @param {string} entryId - The ID of the entry to delete
 */
function deleteEntry(entryId) {
    showConfirmDialog(
        'Διαγραφή Εγγραφής', 
        'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εγγραφή;',
        () => {
            appState.entries = appState.entries.filter(entry => entry.id !== entryId);
            
            if (saveData()) {
                updateUI();
                showToast('Η εγγραφή διαγράφηκε με επιτυχία');
            }
        }
    );
}

/**
 * Clear all data
 */
function clearAllData() {
    showConfirmDialog(
        'Διαγραφή Όλων των Δεδομένων', 
        'Είστε σίγουροι ότι θέλετε να διαγράψετε όλες τις εγγραφές; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.',
        () => {
            appState.entries = [];
            
            if (saveData()) {
                updateUI();
                showToast('Όλα τα δεδομένα διαγράφηκαν με επιτυχία');
            }
        }
    );
}

// ========== UI FUNCTIONALITY ==========

/**
 * Setup tab navigation
 */
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Update UI for the selected tab
            if (tabId === 'financial') {
                updateFinancialUI();
            }
        });
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Daily input calculation
    document.getElementById('milk-quantity').addEventListener('input', calculatePerAnimal);
    document.getElementById('animal-count').addEventListener('input', calculatePerAnimal);
    
    // Save entry
    document.getElementById('save-entry').addEventListener('click', () => {
        const quantity = parseFloat(document.getElementById('milk-quantity').value);
        const dateInput = document.getElementById('milk-date').value;
        const animalCount = parseInt(document.getElementById('animal-count').value) || 1;
        
        if (!quantity || quantity <= 0) {
            showToast('Παρακαλώ εισάγετε έγκυρη ποσότητα γάλακτος');
            return;
        }
        
        if (!dateInput) {
            showToast('Παρακαλώ επιλέξτε ημερομηνία και ώρα');
            return;
        }
        
        const entry = {
            quantity,
            date: new Date(dateInput),
            animalCount,
            perAnimal: quantity / animalCount
        };
        
        addEntry(entry);
    });
    
    // Financial calculations
    document.getElementById('calculate-financials').addEventListener('click', () => {
        const price = parseFloat(document.getElementById('milk-price').value);
        
        if (!price || price <= 0) {
            showToast('Παρακαλώ εισάγετε έγκυρη τιμή γάλακτος');
            return;
        }
        
        appState.settings.milkPrice = price;
        saveData();
        updateFinancialUI();
    });
    
    // Report generation
    document.getElementById('generate-report').addEventListener('click', generateReport);
    document.getElementById('print-report').addEventListener('click', printReport);
    
    // Report type selection
    document.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.report-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Backup & restore
    document.getElementById('backup-data').addEventListener('click', backupToCloud);
    document.getElementById('backup-local').addEventListener('click', backupToLocal);
    document.getElementById('restore-data').addEventListener('click', restoreData);
    
    // Data management
    document.getElementById('clear-all-data').addEventListener('click', clearAllData);
    document.getElementById('delete-selected').addEventListener('click', deleteSelectedEntries);
    
    // Dialog controls
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        document.getElementById('confirm-dialog').style.display = 'none';
    });
}

/**
 * Set the date-time input to current date and time
 */
function setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('milk-date').value = dateTimeStr;
}

/**
 * Calculate per animal milk average
 */
function calculatePerAnimal() {
    const quantity = parseFloat(document.getElementById('milk-quantity').value) || 0;
    const animalCount = parseInt(document.getElementById('animal-count').value) || 1;
    
    const perAnimal = quantity / animalCount;
    document.getElementById('per-animal').textContent = `${perAnimal.toFixed(2)} kg`;
}

/**
 * Update all UI elements based on current state
 */
function updateUI() {
    updateEntriesList();
    updateTotalMilk();
    populateMilkPrice();
    updateFinancialUI();
}

/**
 * Update the entries list in the UI
 */
function updateEntriesList() {
    const entriesList = document.getElementById('entries-list');
    entriesList.innerHTML = '';
    
    if (appState.entries.length === 0) {
        entriesList.innerHTML = '<div class="entry-item">Δεν υπάρχουν εγγραφές ακόμα</div>';
        return;
    }
    
    // Display most recent 10 entries
    const recentEntries = appState.entries.slice(0, 10);
    
    recentEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const formattedDate = `${entryDate.toLocaleDateString('el-GR')} ${entryDate.toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'})}`;
        
        const entryEl = document.createElement('div');
        entryEl.className = 'entry-item';
        entryEl.innerHTML = `
            <span>${formattedDate}</span>
            <span>${entry.quantity.toFixed(1)} kg</span>
            <div class="entry-action">
                <button class="action-btn delete-entry" data-id="${entry.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        entriesList.appendChild(entryEl);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const entryId = e.currentTarget.getAttribute('data-id');
            deleteEntry(entryId);
        });
    });
}

/**
 * Update the total milk display
 */
function updateTotalMilk() {
    const totalMilk = appState.entries.reduce((sum, entry) => sum + entry.quantity, 0);
    document.getElementById('total-milk').textContent = `${totalMilk.toFixed(1)} kg`;
}

/**
 * Populate milk price input from saved settings
 */
function populateMilkPrice() {
    if (appState.settings.milkPrice > 0) {
        document.getElementById('milk-price').value = appState.settings.milkPrice;
    }
}

/**
 * Update financial tab UI
 */
function updateFinancialUI() {
    const totalMilk = appState.entries.reduce((sum, entry) => sum + entry.quantity, 0);
    const milkPrice = appState.settings.milkPrice || 0;
    const totalRevenue = totalMilk * milkPrice;
    
    // Calculate average daily revenue and per animal production
    let avgDailyRevenue = 0;
    let totalAnimals = 0;
    let avgPerAnimal = 0;
    
    if (appState.entries.length > 0) {
        // Get unique days
        const uniqueDays = new Set(
            appState.entries.map(entry => 
                new Date(entry.date).toLocaleDateString()
            )
        );
        
        avgDailyRevenue = totalRevenue / uniqueDays.size;
        
        // Calculate average per animal
        totalAnimals = appState.entries.reduce((sum, entry) => sum + entry.animalCount, 0);
        if (totalAnimals > 0) {
            avgPerAnimal = totalMilk / totalAnimals;
        }
    }
    
    // Update UI elements
    document.getElementById('financial-total-milk').textContent = `${totalMilk.toFixed(1)} kg`;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('avg-daily-revenue').textContent = `$${avgDailyRevenue.toFixed(2)}`;
    
    // Update or create per animal average element
    const financialResults = document.querySelector('.financial-results');
    let avgPerAnimalElement = document.getElementById('avg-per-animal');
    
    if (!avgPerAnimalElement) {
        // Create the element if it doesn't exist
        const newItem = document.createElement('div');
        newItem.className = 'financial-item';
        newItem.innerHTML = `
            <span>Μέσος Όρος ανά Ζώο:</span>
            <span id="avg-per-animal">${avgPerAnimal.toFixed(2)} kg</span>
        `;
        
        // Insert it before the last item (total revenue)
        financialResults.insertBefore(newItem, document.getElementById('total-revenue').parentNode);
        avgPerAnimalElement = document.getElementById('avg-per-animal');
    } else {
        // Update existing element
        avgPerAnimalElement.textContent = `${avgPerAnimal.toFixed(2)} kg`;
    }
}

/**
 * Generate a report based on selected date range and type
 */
function generateReport() {
    const startDate = document.getElementById('report-start').value;
    const endDate = document.getElementById('report-end').value;
    
    if (!startDate || !endDate) {
            showToast('Παρακαλώ επιλέξτε ημερομηνίες έναρξης και λήξης');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59); // Include the entire end day
    
    if (start > end) {
        showToast('Η ημερομηνία έναρξης πρέπει να είναι πριν την ημερομηνία λήξης');
        return;
    }
    
    // Filter entries by date range
    const filteredEntries = appState.entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
    });
    
    if (filteredEntries.length === 0) {
        document.getElementById('report-preview').innerHTML = `
            <div class="empty-report">
                <p>Δεν βρέθηκαν εγγραφές στο επιλεγμένο χρονικό διάστημα.</p>
            </div>
        `;
        return;
    }
    
    // Determine report type
    let reportType = 'daily';
    document.querySelectorAll('.report-btn').forEach(btn => {
        if (btn.classList.contains('active')) {
            reportType = btn.id.replace('-report', '');
        }
    });
    
    // Generate report HTML
    let reportHTML = `
        <h3>Αναφορά Παραγωγής Γάλακτος</h3>
        <p>Περίοδος: ${start.toLocaleDateString()} έως ${end.toLocaleDateString()}</p>
        <div class="report-stats">
            <div class="report-stat-item">
                <span>Συνολικό Γάλα:</span>
                <span>${filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0).toFixed(1)} kg</span>
            </div>
            <div class="report-stat-item">
                <span>Μέσος Όρος ανά Ημέρα:</span>
                <span>${(filteredEntries.reduce((sum, entry) => sum + entry.quantity, 0) / (
                    (end - start) / (1000 * 60 * 60 * 24) + 1
                )).toFixed(1)} kg</span>
            </div>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Ημερομηνία</th>
                    <th>Ποσότητα (kg)</th>
                    <th>Ζώα</th>
                    <th>Ανά Ζώο (kg)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Group entries based on report type
    const groupedEntries = {};
    
    filteredEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        let groupKey;
        
        if (reportType === 'daily') {
            groupKey = entryDate.toLocaleDateString('el-GR');
        } else if (reportType === 'weekly') {
            // Get the week number
            const firstDayOfYear = new Date(entryDate.getFullYear(), 0, 1);
            const pastDaysOfYear = (entryDate - firstDayOfYear) / 86400000;
            const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            groupKey = `Εβδομάδα ${weekNum}, ${entryDate.getFullYear()}`;
        } else if (reportType === 'monthly') {
            groupKey = `${entryDate.toLocaleString('el-GR', { month: 'long' })} ${entryDate.getFullYear()}`;
        }
        
        if (!groupedEntries[groupKey]) {
            groupedEntries[groupKey] = {
                quantity: 0,
                animalCount: 0,
                entries: 0
            };
        }
        
        groupedEntries[groupKey].quantity += entry.quantity;
        groupedEntries[groupKey].animalCount += entry.animalCount;
        groupedEntries[groupKey].entries += 1;
    });
    
    // Add rows to report
    Object.keys(groupedEntries).forEach(groupKey => {
        const group = groupedEntries[groupKey];
        const avgAnimalCount = Math.round(group.animalCount / group.entries);
        const perAnimal = group.quantity / group.animalCount;
        
        reportHTML += `
            <tr>
                <td>${groupKey}</td>
                <td>${group.quantity.toFixed(1)}</td>
                <td>${avgAnimalCount}</td>
                <td>${perAnimal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    reportHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('report-preview').innerHTML = reportHTML;
    showToast('Η αναφορά δημιουργήθηκε με επιτυχία');
}

/**
 * Print the currently displayed report
 */
function printReport() {
    const reportPreview = document.getElementById('report-preview');
    
    if (reportPreview.innerHTML.trim() === '') {
        showToast('Παρακαλώ δημιουργήστε πρώτα μια αναφορά');
        return;
    }
    
    // Create a printable version
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Αναφορά Παραγωγής Γάλακτος</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h3 { color: #166088; }
                .report-stats { margin: 20px 0; }
                .report-stat-item { margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            ${reportPreview.innerHTML}
        </body>
        </html>
    `;
    
    // Open a new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Print after content is loaded
    printWindow.onload = function() {
        printWindow.print();
    };
}

/**
 * Backup data to cloud (simulated)
 */
function backupToCloud() {
   // Replace with your Supabase project details
    
    showToast('Δημιουργία αντιγράφου ασφαλείας στο cloud...');
    
    // Simulate API call with timeout
    setTimeout(() => {
    appState.settings.lastBackupDate = new Date();
    appState.settings.cloudBackupEnabled = true;
    saveData();
    showToast('Το αντίγραφο ασφαλείας στο cloud ολοκληρώθηκε');
   }, 1500);
}

/**
 * Backup data to local device
 */
function backupToLocal() {
    // Create a JSON file with the data
    const dataStr = JSON.stringify(appState, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create a link element to trigger download
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', `milk-tracker-backup-${new Date().toISOString().slice(0,10)}.json`);
    
    // Append to body, click and remove
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
    
    showToast('Το αρχείο αντιγράφου ασφαλείας κατέβηκε με επιτυχία');
}

/**
 * Restore data from backup
 */
function restoreData() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedData = JSON.parse(event.target.result);
                
                // Validate the data structure
                if (!parsedData.entries || !Array.isArray(parsedData.entries)) {
                    throw new Error('Μη έγκυρη μορφή αρχείου αντιγράφου ασφαλείας');
                }
                
                // Show confirmation dialog
                showConfirmDialog(
        'Επαναφορά Δεδομένων', 
        'Αυτό θα αντικαταστήσει όλα τα τρέχοντα δεδομένα με το αντίγραφο ασφαλείας. Συνέχεια;',
                    () => {
                        // Convert date strings back to Date objects
                        parsedData.entries = parsedData.entries.map(entry => ({
                            ...entry,
                            date: new Date(entry.date)
                        }));
                        
                        // Update app state
                        appState.entries = parsedData.entries;
                        appState.settings = {
                            ...appState.settings,
                            ...parsedData.settings
                        };
                        
                        saveData();
                        updateUI();
                        showToast('Τα δεδομένα επαναφέρθηκαν με επιτυχία');
                    }
                );
            } catch (error) {
                console.error('Error parsing backup file:', error);
                showToast('Μη έγκυρη μορφή αρχείου αντιγράφου ασφαλείας');
            }
        };
        
        reader.readAsText(file);
    });
    
    // Trigger the file input
    fileInput.click();
}

/**
 * Delete selected entries (placeholder for extended functionality)
 */
function deleteSelectedEntries() {
    showToast('Δεν έχουν επιλεγεί εγγραφές. Παρακαλώ επιλέξτε εγγραφές για διαγραφή.');
}

/**
 * Show a confirmation dialog
 * @param {string} title - The dialog title
 * @param {string} message - The dialog message
 * @param {Function} onConfirm - Function to call when confirmed
 */
function showConfirmDialog(title, message, onConfirm) {
    const dialog = document.getElementById('confirm-dialog');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-ok');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    // Remove previous event listener
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', () => {
        dialog.style.display = 'none';
        onConfirm();
    });
    
    dialog.style.display = 'block';
}

/**
 * Show a toast message
 * @param {string} message - The message to display
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add CSS for the report table and dialog that wasn't in the original CSS
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .report-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }
    
    .report-table th, .report-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .report-table th {
        background-color: var(--light-color);
        color: var(--secondary-color);
        font-weight: 500;
    }
    
    .report-stats {
        margin: 15px 0;
    }
    
    .report-stat-item {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--light-gray);
    }
    
    .empty-report {
        padding: 20px;
        text-align: center;
        color: var(--gray-color);
    }
`;
document.head.appendChild(additionalStyles);
