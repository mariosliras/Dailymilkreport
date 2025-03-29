document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAfxIneqtc-SIul4TZxBwxzdE6BsccpQ4s",
        authDomain: "daily-milk-report.firebaseapp.com",
        databaseURL: "https://daily-milk-report-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "daily-milk-report",
        storageBucket: "daily-milk-report.firebasestorage.app",
        messagingSenderId: "228934370198",
        appId: "1:228934370198:web:a7378013aa905c790853b7",
    };

    // Initialize only once
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // 2. DOM Elements
    const saveBtn = document.getElementById('save-btn');
    const milkAmountInput = document.getElementById('milk-amount');
    
    // 3. Local storage fallback
    let milkData = JSON.parse(localStorage.getItem('milkData')) || [];
    
    // 4. Button handler with Firebase
    saveBtn.addEventListener('click', async function() {
        const amount = parseFloat(milkAmountInput.value);
        
        if (isNaN(amount)) {
            alert('Please enter valid amount');
            return;
        }

        const newEntry = {
            amount: amount,
            timestamp: Date.now()
        };

        try {
            // A. Save to localStorage (works immediately)
            milkData.push(newEntry);
            localStorage.setItem('milkData', JSON.stringify(milkData));
            
            // B. Save to Firebase if authenticated
            const user = firebase.auth().currentUser;
            if (user) {
                await firebase.database().ref(`users/${user.uid}/entries`).push(newEntry);
                console.log("Saved to Firebase");
            }
            
            updateUI();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Error saving data");
        }
    });

    // 5. Authentication state listener
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User signed in:", user.email);
            loadFirebaseData(user.uid);
        } else {
            console.log("No user signed in");
            // Optional: Add sign-in button
        }
    });

    function loadFirebaseData(userId) {
        firebase.database().ref(`users/${userId}/entries`).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data) {
                    milkData = Object.values(data);
                    localStorage.setItem('milkData', JSON.stringify(milkData));
                    updateUI();
                }
            });
    }

    function updateUI() {
        // Your existing UI update code
        console.log("Data updated:", milkData);
    }
	
    });

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const navBtns = document.querySelectorAll('.nav-btn');
    const panels = document.querySelectorAll('.panel');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const wipeHistoryBtn = document.getElementById('wipe-history-btn');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const milkAmountInput = document.getElementById('milk-amount');
    const inputDate = document.getElementById('input-date');
    const inputTime = document.getElementById('input-time');
    const dailyEntriesDiv = document.getElementById('daily-entries');
    const dailyTotalSpan = document.getElementById('daily-total');
    const reportContentDiv = document.getElementById('report-content');
    const milkPriceInput = document.getElementById('milk-price');
    const totalMilkSpan = document.getElementById('total-milk');
    const totalValueSpan = document.getElementById('total-value');
    
    // Initialize with current date and time
    const now = new Date();
    inputDate.valueAsDate = now;
    inputTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Load data from localStorage
    let milkData = JSON.parse(localStorage.getItem('milkData')) || [];
    let milkPrice = parseFloat(localStorage.getItem('milkPrice')) || 0;
    
    // If milkPrice is set, display it in the input
    if (milkPrice > 0) {
        milkPriceInput.value = milkPrice.toFixed(2);
    }
    
    // Navigation functionality
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and panels
            navBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active-panel'));
            
            // Add active class to clicked button and corresponding panel
            this.classList.add('active');
            const panelId = this.getAttribute('data-panel');
            document.getElementById(panelId).classList.add('active-panel');
            
            // If switching to money panel, calculate totals
            if (panelId === 'money-panel') {
                calculateTotals();
            }
        });
    });
    
    // Save new milk entry
    saveBtn.addEventListener('click', function() {
        const amount = parseFloat(milkAmountInput.value);
        const date = inputDate.value;
        const time = inputTime.value;
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid milk amount');
            return;
        }
        
        if (!date || !time) {
            alert('Please enter date and time');
            return;
        }
        
        const entry = {
            id: Date.now(),
            amount: amount,
            date: date,
            time: time,
            timestamp: new Date(`${date}T${time}`).getTime()
        };
        
        milkData.push(entry);
        saveData();
        updateDailyEntries();
        milkAmountInput.value = '';
        milkAmountInput.focus();
    });
    
    // Delete last entry
    deleteBtn.addEventListener('click', function() {
        if (milkData.length === 0) {
            alert('No entries to delete');
            return;
        }
        
        if (confirm('Are you sure you want to delete the last entry?')) {
            milkData.pop();
            saveData();
            updateDailyEntries();
        }
    });
    
    // Wipe all history
    wipeHistoryBtn.addEventListener('click', function() {
        if (milkData.length === 0) {
            alert('No entries to delete');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL entries? This cannot be undone.')) {
            milkData = [];
            saveData();
            updateDailyEntries();
            reportContentDiv.innerHTML = '';
        }
    });
    
    // Generate report
    generateReportBtn.addEventListener('click', function() {
        if (milkData.length === 0) {
        reportContentDiv.innerHTML = '<p>Δεν υπάρχουν δεδομένα για δημιουργία αναφοράς</p>';
        return;
        }
    
    // Group by date
    const groupedData = {};
    milkData.forEach(entry => {
        if (!groupedData[entry.date]) {
            groupedData[entry.date] = {
                total: 0,
                entries: []
            };
        }
        groupedData[entry.date].total += entry.amount;
        groupedData[entry.date].entries.push(entry);
    });
    
    // Sort dates in descending order
    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));
    
    // Generate HTML
    let html = '<h3>Αναφορά Παραγωγής Γάλακτος</h3>';
    
    sortedDates.forEach(date => {
        html += `<div class="report-date-group">
                    <h4>${formatDate(date)} - Σύνολο: ${groupedData[date].total.toFixed(2)} kg</h4>
                    <ul>`;
        
        // Sort entries by time
        groupedData[date].entries.sort((a, b) => b.timestamp - a.timestamp);
        
        groupedData[date].entries.forEach(entry => {
            html += `<li>${entry.time} - ${entry.amount.toFixed(2)} kg</li>`;
        });
        
        html += `</ul></div>`;
    });
    
    // Add overall totals
    const overallTotal = milkData.reduce((sum, entry) => sum + entry.amount, 0);
    const overallValue = overallTotal * milkPrice;
    
    html += `<div class="report-total">
                <strong>Συνολική Ποσότητα: ${overallTotal.toFixed(2)} kg</strong>
                <strong>Συνολική Αξία: €${overallValue.toFixed(2)}</strong>
             </div>`;
    
    reportContentDiv.innerHTML = html;
    });

    // Print report
document.getElementById('print-report-btn').addEventListener('click', function() {
    if (reportContentDiv.innerHTML.trim() === '') {
        alert('Δεν υπάρχει αναφορά για εκτύπωση. Παρακαλώ δημιουργήστε πρώτα μια αναφορά.');
        return;
    }

    // Create print-friendly HTML
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Αναφορά Παραγωγής Γάλακτος</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; padding: 15px; }
                h1 { color: #2E7D32; text-align: center; font-size: 1.5rem; }
                h3 { color: #2E7D32; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                ul { list-style-type: none; padding-left: 0; }
                li { padding: 3px 0; }
                .report-total { margin-top: 20px; padding-top: 10px; border-top: 2px solid #2E7D32; }
                .report-total strong { display: block; margin: 5px 0; }
                @page { size: auto; margin: 5mm; }
            </style>
        </head>
        <body>
            <h1>Αναφορά Παραγωγής Γάλακτος</h1>
            ${reportContentDiv.innerHTML}
            <p style="text-align: right; font-size: 0.8em; margin-top: 20px;">
                Εκτυπώθηκε: ${new Date().toLocaleDateString('el-GR')} ${new Date().toLocaleTimeString('el-GR')}
            </p>
        </body>
        </html>
    `;

    // Mobile-friendly print solution
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // For mobile devices - use iframe method
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow || iframe.contentDocument;
        if (iframeDoc.document) {
            iframeDoc = iframeDoc.document;
        }
        
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();
        
        // Delay print to ensure content loads
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            document.body.removeChild(iframe);
        }, 500);
    } else {
        // For desktop - original method
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    }
});
    
    // Backup data (simulated cloud storage)
    backupBtn.addEventListener('click', function() {
        if (milkData.length === 0) {
            alert('No data to backup');
            return;
        }
        
        // In a real app, this would upload to a cloud service
        // For this demo, we'll just simulate it with localStorage
        localStorage.setItem('milkDataBackup', JSON.stringify(milkData));
        localStorage.setItem('milkPriceBackup', milkPrice.toString());
        alert('Data backed up successfully!');
    });
    
    // Restore data (simulated cloud storage)
    restoreBtn.addEventListener('click', function() {
        if (confirm('Restore will overwrite current data. Continue?')) {
            const backupData = JSON.parse(localStorage.getItem('milkDataBackup')) || [];
            const backupPrice = parseFloat(localStorage.getItem('milkPriceBackup')) || 0;
            
            if (backupData.length === 0) {
                alert('No backup data found');
                return;
            }
            
            milkData = backupData;
            milkPrice = backupPrice;
            saveData();
            updateDailyEntries();
            
            if (milkPrice > 0) {
                milkPriceInput.value = milkPrice.toFixed(2);
            }
            
            alert('Data restored successfully!');
        }
    });
    
    // Calculate total value
    calculateBtn.addEventListener('click', function() {
        milkPrice = parseFloat(milkPriceInput.value) || 0;
        localStorage.setItem('milkPrice', milkPrice.toString());
        calculateTotals();
    });
    
    // Update daily entries display
    function updateDailyEntries() {
        const today = inputDate.value;
        const todayEntries = milkData.filter(entry => entry.date === today);
        
        dailyEntriesDiv.innerHTML = '';
        
        if (todayEntries.length === 0) {
            dailyEntriesDiv.innerHTML = '<p>No entries for today</p>';
            dailyTotalSpan.textContent = '0.00 kg';
            return;
        }
        
        todayEntries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'entry-item';
            entryDiv.innerHTML = `
                <span>${entry.time}</span>
                <span>${entry.amount.toFixed(2)} kg</span>
            `;
            dailyEntriesDiv.appendChild(entryDiv);
        });
        
        const dailyTotal = todayEntries.reduce((sum, entry) => sum + entry.amount, 0);
        dailyTotalSpan.textContent = `${dailyTotal.toFixed(2)} kg`;
    }
    
    // Calculate total milk and value
    function calculateTotals() {
        const totalMilk = milkData.reduce((sum, entry) => sum + entry.amount, 0);
        const totalValue = totalMilk * milkPrice;
        
        totalMilkSpan.textContent = `${totalMilk.toFixed(2)} kg`;
        totalValueSpan.textContent = `$${totalValue.toFixed(2)}`;
    }
    
    // Save data to localStorage
    function saveData() {
        localStorage.setItem('milkData', JSON.stringify(milkData));
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Initialize the daily entries display
    updateDailyEntries();
});
