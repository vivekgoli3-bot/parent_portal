(function showRuntimeWarning() {
  if (window.location.protocol !== "file:") {
    return;
  }

  const warningMessage =
    "This portal page was opened as a local file, so the ERP scripts cannot run correctly. Start the backend and open http://localhost:5000 instead.";

  const mountWarning = function () {
    if (!document.body) {
      return;
    }

    if (!document.querySelector(".runtime-warning")) {
      const banner = document.createElement("div");
      banner.className = "runtime-warning";
      banner.textContent = warningMessage;
      document.body.insertBefore(banner, document.body.firstChild);
    }

    document.querySelectorAll("form").forEach(function bindFormWarning(form) {
      form.addEventListener("submit", function preventBrokenSubmit(event) {
        event.preventDefault();

        const statusElement = document.getElementById("studentsMessage")
          || document.getElementById("overviewMessage")
          || document.getElementById("attendanceMessage")
          || document.getElementById("academicsMessage")
          || document.getElementById("authMessage");

        if (statusElement) {
          statusElement.textContent = warningMessage;
          statusElement.dataset.state = "error";
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }, true);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWarning, { once: true });
    return;
  }

  mountWarning();
}());
