document.addEventListener("DOMContentLoaded", () => {

    let allBills = [];

    // Generate Report Button
    document.querySelector(".generate-btn")
        .addEventListener("click", loadReport);

    // Filter Button
    document.getElementById("applyFilter")
        .addEventListener("click", applyFilters);

    async function loadReport() {

        try {

            const response =
                await fetch("/admin/Bill");

            allBills = await response.json();

            populateTable(allBills);

            updateSummary(allBills);

        } catch (err) {

            console.log(err);
            alert("Failed to load report");

        }

    }

function populateTable(bills){

    const tbody =
    document.getElementById(
        "tableBody"
    );

    tbody.innerHTML = "";

    bills.forEach((bill,index)=>{

        const units =
        (bill.currentReading || 0)
        -
        (bill.previousReading || 0);

        tbody.innerHTML += `

        <tr>

            <td>${index+1}</td>

            <td>${bill.billId || "-"}</td>

            <td>${bill.name}</td>

            <td>${bill.block}</td>

            <td>${bill.room}</td>

            <td>${bill.email || "-"}</td>

            <td>${bill.previousReading || 0}</td>

            <td>${bill.currentReading || 0}</td>

            <td>${bill.currentReading-bill.previousReading}</td>

            <td>${bill.month}</td>

            <td>
                ₹${Number(
                    bill.amount || 0
                ).toLocaleString()}
            </td>

            <td>

                <span class="${
                    bill.status==="Paid"
                    ?
                    "paid"
                    :
                    "unpaid"
                }">

                    ${bill.status}

                </span>

            </td>

        </tr>

        `;

    });

}

    function updateSummary(bills) {

        const totalBills =
            bills.length;

        const paidBills =
            bills.filter(
                b => b.status === "Paid"
            ).length;

        const unpaidBills =
            bills.filter(
                b => b.status !== "Paid"
            ).length;

        const totalRevenue =
            bills.reduce(
                (sum, b) =>
                    sum + Number(b.amount || 0),
                0
            );

        const pendingRevenue =
            bills
                .filter(
                    b => b.status !== "Paid"
                )
                .reduce(
                    (sum, b) =>
                        sum + Number(b.amount || 0),
                    0
                );

        document.getElementById("totalBills")
            .innerText = totalBills;

        document.getElementById("paidBills")
            .innerText = paidBills;

        document.getElementById("unpaidBills")
            .innerText = unpaidBills;

        document.getElementById("totalRevenue")
            .innerText = "₹" +
            totalRevenue.toLocaleString();

        document.getElementById("pendingRevenue")
            .innerText = "₹" +
            pendingRevenue.toLocaleString();

    }

    function applyFilters() {

        const searchText =
            document
            .getElementById("searchName")
            .value
            .toLowerCase();

        const status =
            document
            .getElementById("statusFilter")
            .value;

        const filtered =
            allBills.filter(bill => {

                const matchName =
                    bill.name
                    .toLowerCase()
                    .includes(searchText);

                const matchStatus =
                    status === "All"
                    || bill.status === status;

                return (
                    matchName &&
                    matchStatus
                );

            });

        populateTable(filtered);

        updateSummary(filtered);

    }

    // Initial Load
    loadReport();

    // PRINT REPORT

document
.getElementById("printBtn")
.addEventListener("click", () => {

    window.print();

});


// EXPORT PDF

document
.getElementById("pdfBtn")
.addEventListener("click", () => {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
        "Water Bill Report",
        20,
        20
    );

    let y = 40;

    document
    .querySelectorAll(
        "#reportTable tbody tr"
    )
    .forEach(row => {

        const text =
        Array.from(row.cells)
        .map(cell =>
            cell.innerText
        )
        .join(" | ");

        pdf.text(text,10,y);

        y += 10;

        if(y > 270){

            pdf.addPage();

            y = 20;
        }

    });

    pdf.save(
        "Water_Bill_Report.pdf"
    );

});


// EXPORT EXCEL

document
.getElementById("excelBtn")
.addEventListener("click", () => {

    const table =
    document
    .getElementById(
        "reportTable"
    );

    const workbook =
    XLSX.utils.table_to_book(
        table,
        {
            sheet:"Report"
        }
    );

    XLSX.writeFile(
        workbook,
        "Water_Bill_Report.xlsx"
    );

});

});