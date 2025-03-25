let milkData = JSON.parse(localStorage.getItem("milkData")) || [];
updateUI();

function storeMilk() {
    let milkInput = document.getElementById("milkInput").value;
    
    if (milkInput === "" || isNaN(milkInput) || milkInput <= 0) {
        alert("Εισαγάγετε έγκυρη ποσότητα γάλακτος!");
        
        return;
    }

    let entry = {
        id: Date.now(),
        amount: parseFloat(milkInput),
        timestamp: new Date().toLocaleString(),
    };

    milkData.push(entry);
    localStorage.setItem("milkData", JSON.stringify(milkData));
     document.getElementById("milkInput").value = "";

    updateUI();
}

function deleteLast() {
    if (milkData.length > 0) {
        milkData.pop();
        localStorage.setItem("milkData", JSON.stringify(milkData));
        updateUI();
    }
}

function clearHistory() {
    if (confirm("Σύγουρα θέλετε να διαγράψετε όλα τα δεδομένα?")) {
        milkData = [];
        localStorage.removeItem("milkData");
        updateUI();
    }
}

function generateReport() {
    let report = "Milk Input Report\n\n";
    milkData.forEach(entry => {
        report += `Date: ${entry.timestamp}, Milk: ${entry.amount} kg\n`;
    });

    let blob = new Blob([report], { type: "text/plain" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Milk_Report.txt";
    a.click();
}

function updateUI() {
    let milkList = document.getElementById("milkList");
    let totalMilk = document.getElementById("totalMilk");

    milkList.innerHTML = "";
    let total = 0;

    milkData.forEach(entry => {
        total += entry.amount;
        let li = document.createElement("li");
        li.textContent = `${entry.amount} kg - ${entry.timestamp}`;
        milkList.appendChild(li);
    });

    totalMilk.textContent = total;
}
