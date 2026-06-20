const placeholderLinks = document.querySelectorAll("[data-placeholder-link]");
let toastTimer;

function showToast(message) {
  let toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("p");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

placeholderLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.tagName === "BUTTON" || link.getAttribute("href") === "#") {
      event.preventDefault();
      showToast(link.dataset.toastMessage || "Lien provisoire : il sera branche dans une prochaine etape.");
    }
  });
});

const contactForm = document.querySelector("[data-contact-form]");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  showToast("Message envoyé à Corentin JOSEPH");
  contactForm.reset();
});

const skillCards = document.querySelectorAll("[data-skill-card]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const projectPreviews = document.querySelectorAll("[data-project-preview]");
const projectsSection = document.querySelector("#projets");
const projectsStage = document.querySelector(".projects-stage");
const projectDetail = document.querySelector(".project-detail");
const selectedProject = document.querySelector(".project-selected");
const selectedProjectImage = selectedProject?.querySelector("img");
const projectCollapse = selectedProject?.querySelector(".project-collapse");
let activeProject = null;
let projectCascadeStarted = false;

function initCursorRing() {
  if (!finePointer.matches || reduceMotion.matches) {
    return;
  }

  const cursorRing = document.createElement("div");
  cursorRing.className = "cursor-ring";
  cursorRing.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursorRing);

  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const current = { x: target.x, y: target.y };
  let animationFrame = null;
  const interactiveSelector = "a, button, input, textarea, select, [role='button']";
  const isInteractive = (targetElement) =>
    targetElement instanceof Element && Boolean(targetElement.closest(interactiveSelector));

  const draw = () => {
    current.x += (target.x - current.x) * 0.18;
    current.y += (target.y - current.y) * 0.18;

    cursorRing.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%) scale(var(--cursor-scale, 1))`;
    animationFrame = window.requestAnimationFrame(draw);
  };

  const start = () => {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(draw);
    }
  };

  document.addEventListener("pointermove", (event) => {
    target.x = event.clientX;
    target.y = event.clientY;
    cursorRing.classList.add("is-visible");
    start();
  });

  document.addEventListener("pointerover", (event) => {
    if (isInteractive(event.target)) {
      cursorRing.classList.add("is-hovering");
    }
  });

  document.addEventListener("pointerout", (event) => {
    if (isInteractive(event.target)) {
      cursorRing.classList.remove("is-hovering");
    }
  });

  document.addEventListener("pointerdown", () => {
    cursorRing.classList.add("is-pressed");
  });

  document.addEventListener("pointerup", () => {
    cursorRing.classList.remove("is-pressed");
  });

  document.addEventListener("mouseleave", () => {
    cursorRing.classList.remove("is-visible", "is-hovering", "is-pressed");

    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  });
}

initCursorRing();

if (skillCards.length) {
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    skillCards.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    skillCards.forEach((item) => observer.observe(item));
  }
}

function revealProjectCascade() {
  if (projectCascadeStarted || !projectPreviews.length) {
    return;
  }

  projectCascadeStarted = true;
  projectsStage?.classList.add("is-activated");

  projectPreviews.forEach((project, index) => {
    const reveal = () => {
      project.classList.add("is-entering");
      window.setTimeout(() => {
        project.classList.add("is-visible");
      }, 20);
    };

    if (reduceMotion.matches) {
      reveal();
    } else {
      window.setTimeout(reveal, index * 95);
    }
  });
}

if (projectPreviews.length) {
  if (reduceMotion.matches || !("IntersectionObserver" in window) || !projectsSection) {
    revealProjectCascade();
  } else {
    const projectsObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          revealProjectCascade();
          projectsObserver.disconnect();
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -18% 0px",
      }
    );

    projectsObserver.observe(projectsSection);
  }
}

function setPressedProject(project) {
  projectPreviews.forEach((item) => {
    const isActive = item === project;
    item.classList.toggle("is-selected", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
}

function closeSelectedProject({ focusProject = true } = {}) {
  if (!activeProject || !projectDetail || !selectedProject) {
    return;
  }

  const projectToFocus = activeProject;
  activeProject = null;
  setPressedProject(null);
  selectedProject.classList.remove("is-open", "is-animating");
  selectedProject.classList.add("is-closing");

  const finishClose = () => {
    selectedProject.hidden = true;
    selectedProject.classList.remove("is-closing");
    projectDetail.classList.remove("has-selection");

    if (focusProject) {
      projectToFocus.focus({ preventScroll: true });
    }
  };

  if (reduceMotion.matches) {
    finishClose();
  } else {
    window.setTimeout(finishClose, 230);
  }
}

function centerSelectedProject() {
  if (!projectDetail) {
    return;
  }

  const behavior = reduceMotion.matches ? "auto" : "smooth";
  const detailRect = projectDetail.getBoundingClientRect();
  const visualOffset =
    window.innerWidth >= 900 ? Math.min(120, Math.max(70, window.innerHeight * 0.08)) : 0;
  const targetTop =
    window.scrollY + detailRect.top + detailRect.height / 2 - window.innerHeight / 2 + visualOffset;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  });
}

function settleSelectedProjectCenter() {
  centerSelectedProject();

  if (!reduceMotion.matches) {
    window.setTimeout(centerSelectedProject, 680);
  }
}

function animateProjectSelection(project, sourceImage, largeSrc) {
  if (!selectedProject || !selectedProjectImage || reduceMotion.matches) {
    selectedProject?.classList.add("is-open");
    return;
  }

  selectedProject.classList.add("is-open", "is-animating");
  const sourceRect = sourceImage.getBoundingClientRect();
  const targetRect = selectedProjectImage.getBoundingClientRect();

  if (!sourceRect.width || !targetRect.width) {
    selectedProject.classList.remove("is-animating");
    selectedProject.classList.add("is-open");
    return;
  }

  const clone = document.createElement("img");
  clone.className = "project-flyout-clone";
  clone.src = largeSrc;
  clone.alt = "";
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.transform = window.getComputedStyle(project).transform;
  document.body.appendChild(clone);

  window.setTimeout(() => {
    clone.style.transition =
      "left 560ms cubic-bezier(0.19, 1, 0.22, 1), top 560ms cubic-bezier(0.19, 1, 0.22, 1), width 560ms cubic-bezier(0.19, 1, 0.22, 1), height 560ms cubic-bezier(0.19, 1, 0.22, 1), transform 560ms cubic-bezier(0.19, 1, 0.22, 1)";
    clone.style.left = `${targetRect.left}px`;
    clone.style.top = `${targetRect.top}px`;
    clone.style.width = `${targetRect.width}px`;
    clone.style.height = `${targetRect.height}px`;
    clone.style.transform = "none";
  }, 20);

  window.setTimeout(() => {
    clone.remove();
    selectedProject.classList.remove("is-animating");
    selectedProject.classList.add("is-open");
  }, 590);
}

projectPreviews.forEach((project) => {
  project.setAttribute("aria-pressed", "false");

  project.addEventListener("click", () => {
    const sourceImage = project.querySelector("img");
    const title = project.dataset.projectTitle || sourceImage?.alt || "Projet";
    const largeSrc = project.dataset.largeSrc || sourceImage?.currentSrc || sourceImage?.src;

    if (projectDetail && selectedProject && selectedProjectImage && sourceImage && largeSrc) {
      activeProject = project;
      setPressedProject(project);
      selectedProject.classList.remove("is-open", "is-closing", "is-animating");
      selectedProject.hidden = false;
      projectDetail.classList.add("has-selection");
      selectedProjectImage.src = largeSrc;
      selectedProjectImage.alt = sourceImage.alt;

      window.setTimeout(() => {
        settleSelectedProjectCenter();
        animateProjectSelection(project, sourceImage, largeSrc);
      }, 20);
    }
  });
});

projectCollapse?.addEventListener("click", () => {
  closeSelectedProject();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeProject) {
    closeSelectedProject({ focusProject: false });
  }
});
