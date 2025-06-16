document.addEventListener("DOMContentLoaded", () => {
  // Join Form Submission
  const joinForm = document.getElementById("join-form");
  if (joinForm) {
    joinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Thank you for your interest! We will contact you soon.");
      this.reset();
    });
  }

  // Dropdown Toggle for Resources
  const resourcesDropdownToggle = document.getElementById(
    "resources-dropdown-toggle"
  );
  const resourcesDropdownMenu = document.getElementById("resources-dropdown");

  if (resourcesDropdownToggle && resourcesDropdownMenu) {
    resourcesDropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();
      resourcesDropdownMenu.classList.toggle("show");
      resourcesDropdownToggle.setAttribute(
        "aria-expanded",
        resourcesDropdownMenu.classList.contains("show")
      );
    });
  }

  // Dropdown Toggle for Media
  const mediaDropdownToggle = document.getElementById("media-dropdown-toggle");
  const mediaDropdownMenu = document.getElementById("media-dropdown");

  if (mediaDropdownToggle && mediaDropdownMenu) {
    mediaDropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();
      mediaDropdownMenu.classList.toggle("show");
      mediaDropdownToggle.setAttribute(
        "aria-expanded",
        mediaDropdownMenu.classList.contains("show")
      );
    });
  }

  // Close both dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (
      resourcesDropdownToggle &&
      resourcesDropdownMenu &&
      !resourcesDropdownToggle.contains(e.target) &&
      !resourcesDropdownMenu.contains(e.target)
    ) {
      resourcesDropdownMenu.classList.remove("show");
      resourcesDropdownToggle.setAttribute("aria-expanded", "false");
    }
    if (
      mediaDropdownToggle &&
      mediaDropdownMenu &&
      !mediaDropdownToggle.contains(e.target) &&
      !mediaDropdownMenu.contains(e.target)
    ) {
      mediaDropdownMenu.classList.remove("show");
      mediaDropdownToggle.setAttribute("aria-expanded", "false");
    }
  });

  // PDF Viewer
  const pdfModal = document.getElementById("pdf-modal");
  const pdfCanvas = document.getElementById("pdf-canvas");
  const closeModal = document.getElementById("close-modal");
  const prevPage = document.getElementById("prev-page");
  const nextPage = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const totalPages = document.getElementById("total-pages");

  if (
    pdfModal &&
    pdfCanvas &&
    closeModal &&
    prevPage &&
    nextPage &&
    pageInfo &&
    totalPages
  ) {
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let scale = 1.0;

    const renderPage = (num) => {
      pageRendering = true;
      pdfDoc.getPage(num).then((page) => {
        // Dynamic scaling based on modal width
        const modalWidth =
          document.querySelector("#pdf-modal .max-w-3xl").clientWidth - 32; // Subtract padding (p-4 = 32px)
        const viewport = page.getViewport({ scale: 1 });
        scale = Math.min(1.0, modalWidth / viewport.width); // Fit to modal width, max scale 1.0
        const scaledViewport = page.getViewport({ scale });

        pdfCanvas.height = scaledViewport.height;
        pdfCanvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: pdfCanvas.getContext("2d"),
          viewport: scaledViewport,
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        });
      });

      pageInfo.textContent = `Page ${num} of `;
      totalPages.textContent = pdfDoc.numPages;
      prevPage.disabled = num <= 1;
      nextPage.disabled = num >= pdfDoc.numPages;
    };

    const queueRenderPage = (num) => {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    };

    document.querySelectorAll(".view-pdf").forEach((button) => {
      button.addEventListener("click", () => {
        const pdfUrl = button.getAttribute("data-pdf");
        pdfModal.classList.add("show");

        pdfjsLib
          .getDocument(pdfUrl)
          .promise.then((pdf) => {
            pdfDoc = pdf;
            pageNum = 1;
            renderPage(pageNum);
          })
          .catch((error) => {
            console.error("Error loading PDF:", error);
            alert("Failed to load PDF. Please try again.");
            pdfModal.classList.remove("show");
          });
      });
    });

    closeModal.addEventListener("click", () => {
      pdfModal.classList.remove("show");
      pdfCanvas
        .getContext("2d")
        .clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
      pdfDoc = null;
      pageNum = 1;
    });

    prevPage.addEventListener("click", () => {
      if (pageNum <= 1) return;
      pageNum--;
      queueRenderPage(pageNum);
    });

    nextPage.addEventListener("click", () => {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
      queueRenderPage(pageNum);
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pdfModal.classList.contains("show")) {
        closeModal.click();
      }
    });
  }
});
