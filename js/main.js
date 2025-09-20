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

  // Dropdown Toggles (About, Media, Resources)
  const dropdownToggles = document.querySelectorAll('#about-dropdown-toggle, #media-dropdown-toggle, #resources-dropdown-toggle');
  const dropdownMenus = {
    'about-dropdown-toggle': 'about-dropdown',
    'media-dropdown-toggle': 'media-dropdown',
    'resources-dropdown-toggle': 'resources-dropdown'
  };

  dropdownToggles.forEach(toggle => {
    const menuId = dropdownMenus[toggle.id];
    const menu = document.getElementById(menuId);

    if (toggle && menu) {
      // Hover to show (desktop)
      toggle.addEventListener("mouseenter", () => {
        if (window.innerWidth > 768) {
          menu.style.display = "block";
          toggle.setAttribute("aria-expanded", "true");
        }
      });

      // Click to toggle (mobile/desktop persistence)
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const isVisible = menu.style.display !== "none";
        if (window.innerWidth <= 768) {
          menu.style.display = isVisible ? "none" : "block";
          toggle.setAttribute("aria-expanded", !isVisible);
        }
      });

      // Mouse leave to hide (desktop)
      toggle.addEventListener("mouseleave", () => {
        if (window.innerWidth > 768) {
          setTimeout(() => {
            if (!menu.matches(":hover")) {
              menu.style.display = "none";
              toggle.setAttribute("aria-expanded", "false");
            }
          }, 200);
        }
      });

      // Hide submenu on leave
      menu.addEventListener("mouseleave", () => {
        if (window.innerWidth > 768) {
          menu.style.display = "none";
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  });

  // Close all dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    dropdownToggles.forEach(toggle => {
      const menuId = dropdownMenus[toggle.id];
      const menu = document.getElementById(menuId);
      if (toggle && menu && !toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = "none";
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Mobile Burger Menu Toggle
  const burger = document.querySelector(".burger");
  const navUl = document.querySelector("nav ul");
  if (burger && navUl) {
    burger.addEventListener("click", () => {
      navUl.classList.toggle("active");
      burger.classList.toggle("active");
      // Hide dropdowns when toggling menu
      dropdownToggles.forEach(toggle => {
        const menuId = dropdownMenus[toggle.id];
        const menu = document.getElementById(menuId);
        if (menu) menu.style.display = "none";
      });
    });

    // Close mobile menu when clicking a link
    navUl.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          navUl.classList.remove("active");
          burger.classList.remove("active");
          dropdownToggles.forEach(toggle => toggle.setAttribute("aria-expanded", "false"));
        }
      });
    });
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