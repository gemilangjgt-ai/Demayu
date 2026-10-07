// ==========================================
// CONFIG SUPABASE
// ==========================================

const SUPABASE_URL = "ISI_URL_SUPABASE_DI_SINI";
const SUPABASE_KEY = "ISI_PUBLISHABLE_KEY_DI_SINI";


// ==========================================
// STATE
// ==========================================

let reports = [];

let selectedPhotos = [];

let editingReportId = null;


// ==========================================
// ELEMENT
// ==========================================

const form =
    document.getElementById("reportForm");

const projectName =
    document.getElementById("projectName");

const locationInput =
    document.getElementById("location");

const weekNumber =
    document.getElementById("weekNumber");

const reportDate =
    document.getElementById("reportDate");

const description =
    document.getElementById("description");

const photoInput =
    document.getElementById("photoInput");

const photoPreview =
    document.getElementById("photoPreview");

const reportList =
    document.getElementById("reportList");

const searchInput =
    document.getElementById("searchInput");

const newReportBtn =
    document.getElementById("newReportBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const totalReports =
    document.getElementById("totalReports");

const totalPhotos =
    document.getElementById("totalPhotos");

const lastReport =
    document.getElementById("lastReport");


// ==========================================
// TANGGAL OTOMATIS
// ==========================================

function setToday() {

    const now = new Date();

    const options = {
        day: "2-digit",
        month: "long",
        year: "numeric"
    };

    reportDate.value =
        now.toLocaleDateString(
            "id-ID",
            options
        );
}


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    form.reset();

    editingReportId = null;

    selectedPhotos = [];

    setToday();

    renderSelectedPhotos();

    document.querySelector(
        ".panel h2"
    ).textContent =
        "Laporan Mingguan";

}


// ==========================================
// PILIH FOTO DARI GALERI
// ==========================================

photoInput.addEventListener(
    "change",
    function () {

        const files =
            Array.from(
                photoInput.files
            );

        files.forEach(file => {

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                function (event) {

                    selectedPhotos.push({
                        id:
                            Date.now() +
                            Math.random(),

                        name:
                            file.name,

                        data:
                            event.target.result,

                        caption:
                            ""
                    });

                    renderSelectedPhotos();

                };

            reader.readAsDataURL(file);

        });

        photoInput.value = "";

    }
);


// ==========================================
// RENDER FOTO
// ==========================================

function renderSelectedPhotos() {

    photoPreview.innerHTML = "";

    selectedPhotos.forEach(
        (photo, index) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "photo-item";


            const image =
                document.createElement(
                    "img"
                );

            image.src =
                photo.data;

            image.alt =
                "Foto dokumentasi";


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "photo-info";


            const caption =
                document.createElement(
                    "textarea"
                );

            caption.placeholder =
                "Keterangan foto...";

            caption.value =
                photo.caption || "";


            caption.addEventListener(
                "input",
                function () {

                    selectedPhotos[index]
                        .caption =
                        caption.value;

                }
            );


            const remove =
                document.createElement(
                    "button"
                );

            remove.className =
                "remove-photo";

            remove.textContent =
                "Hapus Foto";


            remove.addEventListener(
                "click",
                function () {

                    selectedPhotos.splice(
                        index,
                        1
                    );

                    renderSelectedPhotos();

                }
            );


            info.appendChild(
                caption
            );

            item.appendChild(
                image
            );

            item.appendChild(
                info
            );

            item.appendChild(
                remove
            );

            photoPreview.appendChild(
                item
            );

        }
    );

}


// ==========================================
// SUPABASE REQUEST
// ==========================================

async function supabaseRequest(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            `${SUPABASE_URL}${endpoint}`,
            {
                ...options,

                headers: {
                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            errorText ||
            "Supabase request gagal"
        );

    }


    if (
        response.status === 204
    ) {
        return null;
    }


    return response.json();

}


// ==========================================
// AMBIL DATA LAPORAN
// ==========================================

async function loadReports() {

    try {

        reports =
            await supabaseRequest(
                "/rest/v1/reports?select=*&order=created_at.desc"
            );


        renderReports();

        updateStats();

    }
    catch (error) {

        console.error(error);

        reportList.innerHTML = `
            <div class="empty">
                Belum terhubung ke database.
            </div>
        `;

    }

}


// ==========================================
// SIMPAN LAPORAN
// ==========================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (
            !SUPABASE_URL ||
            SUPABASE_URL.includes(
                "ISI_URL"
            )
        ) {

            alert(
                "Supabase belum disambungkan."
            );

            return;

        }


        if (
            selectedPhotos.length === 0
        ) {

            const lanjut =
                confirm(
                    "Belum ada foto. Simpan laporan tanpa foto?"
                );

            if (!lanjut) {
                return;
            }

        }


        const reportData = {

            project_name:
                projectName.value.trim(),

            location:
                locationInput.value.trim(),

            week_number:
                Number(
                    weekNumber.value
                ),

            description:
                description.value.trim()

        };


        try {

            let savedReport;


            // ==============================
            // EDIT
            // ==============================

            if (editingReportId) {

                savedReport =
                    await supabaseRequest(
                        `/rest/v1/reports?id=eq.${editingReportId}`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Prefer":
                                    "return=representation"
                            },

                            body:
                                JSON.stringify(
                                    reportData
                                )
                        }
                    );


                savedReport =
                    savedReport[0];

            }


            // ==============================
            // BARU
            // ==============================

            else {

                savedReport =
                    await supabaseRequest(
                        "/rest/v1/reports",
                        {
                            method:
                                "POST",

                            headers: {
                                "Prefer":
                                    "return=representation"
                            },

                            body:
                                JSON.stringify(
                                    reportData
                                )
                        }
                    );


                savedReport =
                    savedReport[0];

            }


            // ==============================
            // UPLOAD FOTO
            // ==============================

            for (
                const photo
                of selectedPhotos
            ) {

                await uploadPhoto(
                    savedReport.id,
                    photo
                );

            }


            alert(
                editingReportId
                    ? "Laporan berhasil diperbarui."
                    : "Laporan berhasil disimpan."
            );


            resetForm();

            await loadReports();

        }
        catch (error) {

            console.error(error);

            alert(
                "Gagal menyimpan laporan.\n\n" +
                error.message
            );

        }

    }
);


// ==========================================
// UPLOAD FOTO
// ==========================================

async function uploadPhoto(
    reportId,
    photo
) {

    const blob =
        dataURLToBlob(
            photo.data
        );


    const extension =
        getExtension(
            photo.name
        );


    const filePath =
        `${reportId}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${extension}`;


    const uploadResponse =
        await fetch(
            `${SUPABASE_URL}/storage/v1/object/report-photos/${filePath}`,
            {
                method:
                    "POST",

                headers: {
                    "apikey":
                        SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                        blob.type ||
                        "image/jpeg"
                },

                body:
                    blob
            }
        );


    if (
        !uploadResponse.ok
    ) {

        throw new Error(
            "Gagal upload foto: " +
            await uploadResponse.text()
        );

    }


    await supabaseRequest(
        "/rest/v1/report_photos",
        {
            method:
                "POST",

            headers: {
                "Prefer":
                    "return=minimal"
            },

            body:
                JSON.stringify({
                    report_id:
                        reportId,

                    file_path:
                        filePath,

                    caption:
                        photo.caption || ""
                })
        }
    );

}


// ==========================================
// DATA URL → BLOB
// ==========================================

function dataURLToBlob(
    dataURL
) {

    const parts =
        dataURL.split(",");

    const mime =
        parts[0]
            .match(
                /:(.*?);/
            )[1];

    const binary =
        atob(parts[1]);

    const array =
        new Uint8Array(
            binary.length
        );


    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        array[i] =
            binary.charCodeAt(i);

    }


    return new Blob(
        [array],
        {
            type: mime
        }
    );

}


// ==========================================
// EXTENSION
// ==========================================

function getExtension(
    filename
) {

    const parts =
        filename.split(".");

    return (
        parts[
            parts.length - 1
        ] || "jpg"
    ).toLowerCase();

}


// ==========================================
// RENDER LAPORAN
// ==========================================

function renderReports() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        reports.filter(
            report => {

                const text =
                    (
                        report.project_name +
                        " " +
                        report.location +
                        " " +
                        report.week_number +
                        " " +
                        report.description
                    ).toLowerCase();


                return text.includes(
                    keyword
                );

            }
        );


    if (
        filtered.length === 0
    ) {

        reportList.innerHTML = `
            <div class="empty">
                Belum ada laporan.
            </div>
        `;

        return;

    }


    reportList.innerHTML = "";


    filtered.forEach(
        report => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "report-card";


            card.innerHTML = `

                <div class="report-header">

                    <div>

                        <div class="report-title">
                            Minggu ke-${escapeHTML(
                                report.week_number
                            )}
                            — ${escapeHTML(
                                report.project_name
                            )}
                        </div>

                        <div class="report-meta">
                            ${escapeHTML(
                                report.location
                            )}
                            ·
                            ${formatDate(
                                report.report_date
                            )}
                        </div>

                    </div>

                </div>


                <div class="report-description">
                    ${escapeHTML(
                        report.description
                    )}
                </div>


                <div
                    class="report-actions"
                >

                    <button
                        class="edit-btn"
                        data-id="${report.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${report.id}"
                    >
                        Hapus
                    </button>

                </div>
            `;


            card
                .querySelector(
                    ".edit-btn"
                )
                .addEventListener(
                    "click",
                    () =>
                        editReport(
                            report
                        )
                );


            card
                .querySelector(
                    ".delete-btn"
                )
                .addEventListener(
                    "click",
                    () =>
                        deleteReport(
                            report.id
                        )
                );


            reportList.appendChild(
                card
            );

        }
    );

}


// ==========================================
// EDIT
// ==========================================

async function editReport(
    report
) {

    editingReportId =
        report.id;


    projectName.value =
        report.project_name;

    locationInput.value =
        report.location;

    weekNumber.value =
        report.week_number;

    description.value =
        report.description;


    setToday();


    selectedPhotos = [];


    renderSelectedPhotos();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ==========================================
// DELETE
// ==========================================

async function deleteReport(
    id
) {

    const confirmDelete =
        confirm(
            "Yakin ingin menghapus laporan ini?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await supabaseRequest(
            `/rest/v1/reports?id=eq.${id}`,
            {
                method:
                    "DELETE"
            }
        );


        await loadReports();

    }
    catch (error) {

        console.error(error);

        alert(
            "Gagal menghapus laporan."
        );

    }

}


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    renderReports
);


// ==========================================
// LAPORAN BARU
// ==========================================

newReportBtn.addEventListener(
    "click",
    function () {

        resetForm();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


cancelBtn.addEventListener(
    "click",
    resetForm
);


// ==========================================
// STATISTIK
// ==========================================

function updateStats() {

    totalReports.textContent =
        reports.length;


    totalPhotos.textContent =
        "Online";


    if (
        reports.length > 0
    ) {

        lastReport.textContent =
            "Minggu " +
            reports[0].week_number;

    }
    else {

        lastReport.textContent =
            "-";

    }

}


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatDate(
    date
) {

    if (!date) {
        return "-";
    }


    return new Date(
        date
    ).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        char => {

            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return map[char];

        }
    );

}


// ==========================================
// IMAGE VIEWER
// ==========================================

const imageViewer =
    document.getElementById(
        "imageViewer"
    );

const viewerImage =
    document.getElementById(
        "viewerImage"
    );

const closeViewer =
    document.getElementById(
        "closeViewer"
    );


closeViewer.addEventListener(
    "click",
    function () {

        imageViewer.classList.remove(
            "show"
        );

    }
);


// ==========================================
// START
// ==========================================

setToday();

loadReports();
