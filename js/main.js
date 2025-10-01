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

  // Navbar and Burger Toggle
  const burger = document.querySelector("[data-burger]");
  const navMenu = document.querySelector("[data-menu='nav-menu']");
  const dropdownToggles = document.querySelectorAll(
    "#about-dropdown-toggle, #media-dropdown-toggle, #resources-dropdown-toggle"
  );

  // Ensure elements exist before adding event listeners
  if (burger && navMenu && dropdownToggles.length > 0) {
    // Toggle burger and nav menu
    burger.addEventListener("click", () => {
      const isActive = burger.classList.contains("active");
      burger.classList.toggle("active");
      navMenu.classList.toggle("active", !isActive); // Ensure toggle works reliably
      // Close dropdowns when menu is toggled
      dropdownToggles.forEach((toggle) => {
        const dropdownId = toggle.getAttribute("id").replace("-toggle", "");
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
          toggle.classList.remove("active");
          dropdown.classList.remove("active");
        }
      });
    });

    // Toggle dropdowns with improved handling
    dropdownToggles.forEach((toggle) => {
      const dropdownId = toggle.getAttribute("id").replace("-toggle", "");
      const dropdown = document.getElementById(dropdownId);
      if (dropdown) {
        // Click toggle for mobile
        toggle.addEventListener("click", (e) => {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            const isActive = toggle.classList.contains("active");
            toggle.classList.toggle("active");
            dropdown.classList.toggle("active", !isActive);
            // Close other dropdowns
            dropdownToggles.forEach((otherToggle) => {
              if (otherToggle !== toggle) {
                const otherDropdownId = otherToggle.getAttribute("id").replace("-toggle", "");
                const otherDropdown = document.getElementById(otherDropdownId);
                if (otherDropdown) {
                  otherToggle.classList.remove("active");
                  otherDropdown.classList.remove("active");
                }
              }
            });
          }
        });

        // Hover support for desktop
        if (window.innerWidth > 768) {
          const parentLi = toggle.closest("li");
          parentLi.addEventListener("mouseenter", () => {
            toggle.classList.add("active");
            dropdown.classList.add("active");
          });
          parentLi.addEventListener("mouseleave", () => {
            setTimeout(() => {
              if (!parentLi.matches(":hover") && !dropdown.matches(":hover")) {
                toggle.classList.remove("active");
                dropdown.classList.remove("active");
              }
            }, 300);
          });
          dropdown.addEventListener("mouseenter", () => {
            toggle.classList.add("active");
            dropdown.classList.add("active");
          });
          dropdown.addEventListener("mouseleave", () => {
            setTimeout(() => {
              if (!parentLi.matches(":hover")) {
                toggle.classList.remove("active");
                dropdown.classList.remove("active");
              }
            }, 300);
          });
        }
      }
    });

    // Close menu when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 768 &&
        burger &&
        navMenu &&
        !navMenu.contains(e.target) &&
        !burger.contains(e.target)
      ) {
        burger.classList.remove("active");
        navMenu.classList.remove("active");
        dropdownToggles.forEach((toggle) => {
          const dropdownId = toggle.getAttribute("id").replace("-toggle", "");
          const dropdown = document.getElementById(dropdownId);
          if (dropdown) {
            toggle.classList.remove("active");
            dropdown.classList.remove("active");
          }
        });
      }
    });
  } else {
    console.error(
      "Error: Navbar elements not found. Ensure 'data-burger' and 'data-menu=\"nav-menu\"' are present in the HTML.",
      { burger, navMenu, dropdownToggles }
    );
  }

  // PDF Viewer (unchanged)
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
        const modalWidth =
          document.querySelector("#pdf-modal .max-w-3xl").clientWidth - 32;
        const viewport = page.getViewport({ scale: 1 });
        scale = Math.min(1.0, modalWidth / viewport.width);
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && pdfModal.classList.contains("show")) {
        closeModal.click();
      }
    });
  }
});