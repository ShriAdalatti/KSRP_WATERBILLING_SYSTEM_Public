let previewData = [];

document.addEventListener("DOMContentLoaded", () => {

    loadHistory();

    // Preview Upload

    document
    .getElementById("previewBtn")
    .addEventListener("click", previewFile);

    // Confirm Upload

    document
    .getElementById("confirmUpload")
    .addEventListener("click", confirmUpload);

    // Download Sample

    document
    .getElementById("sampleBtn")
    .addEventListener("click", () => {

        window.location.href =
        "/admin/sample-excel";

    });

});

// =========================
// PREVIEW EXCEL
// =========================

async function previewFile() {

    const file =
    document.getElementById(
        "excelFile"
    ).files[0];

    if(!file){

        alert(
            "Please select Excel file"
        );

        return;
    }

    const formData =
    new FormData();

    formData.append(
        "excelFile",
        file
    );

    try{

        const response =
        await fetch(
            "/admin/upload-preview",
            {
                method:"POST",
                body:formData
            }
        );

        const result =
        await response.json();

        previewData =
        result.preview;

        // Summary

        document
        .getElementById(
            "totalRecords"
        ).innerText =
        result.totalRecords;

        document
        .getElementById(
            "validRecords"
        ).innerText =
        result.validRecords;

        document
        .getElementById(
            "duplicateRecords"
        ).innerText =
        result.duplicateRecords;

        // Preview Table

        const tbody =
        document.getElementById(
            "previewBody"
        );

        tbody.innerHTML = "";

        result.preview.forEach(
            row => {

            tbody.innerHTML += `
            <tr>

                <td>${row.Name}</td>

                <td>${row.Email}</td>

                <td>${row.Block}</td>

                <td>${row.Room}</td>
                <td>${row.previousReading}</td>
                <td>${row.currentReading}</td>

                <td>₹${row.Amount}</td>

                <td>${row.Month}</td>

                <td>${row.Year}</td>

            </tr>
            `;

        });

        alert(
            "Preview Generated Successfully"
        );

    }
    catch(err){

        console.log(err);

        alert(
            "Preview Failed"
        );

    }

}

// =========================
// CONFIRM UPLOAD
// =========================

async function confirmUpload() {

    if(
        previewData.length === 0
    ){

        alert(
            "Please preview file first"
        );

        return;

    }

    const file =
    document.getElementById(
        "excelFile"
    ).files[0];

    const month =
    document.getElementById(
        "month"
    ).value;

    const year =
    document.getElementById(
        "year"
    ).value;

    try{

        const response =
        await fetch(
            "/admin/confirm-upload",
            {
                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({

                    records:
                    previewData,

                    fileName:
                    file.name,

                    month,

                    year,

                    totalRecords:
                    document
                    .getElementById(
                        "totalRecords"
                    )
                    .innerText,

                    duplicateRecords:
                    document
                    .getElementById(
                        "duplicateRecords"
                    )
                    .innerText

                })

            }
        );

        const result =
        await response.json();

        if(result.success){

            alert(
                "Bills Uploaded Successfully"
            );

            loadHistory();

            document
            .getElementById(
                "previewBody"
            )
            .innerHTML = "";

        }
        else{

            alert(
                "Upload Failed"
            );

        }

    }
    catch(err){

        console.log(err);

        alert(
            "Server Error"
        );

    }

}

// =========================
// LOAD HISTORY
// =========================

async function loadHistory(){

    try{

        const response =
        await fetch(
            "/admin/upload-history"
        );

        const history =
        await response.json();

        const tbody =
        document.getElementById(
            "historyBody"
        );

        tbody.innerHTML = "";

        history.forEach(
            item => {

            tbody.innerHTML += `
            <tr>

                <td>
                    ${item.fileName}
                </td>

                <td>
                    ${item.month}
                </td>

                <td>
                    ${item.year}
                </td>

                <td>
                    ${item.totalRecords}
                </td>

                <td>
                    ${new Date(
                        item.uploadedAt
                    ).toLocaleDateString()}
                </td>

            </tr>
            `;

        });

    }
    catch(err){

        console.log(err);

    }

}