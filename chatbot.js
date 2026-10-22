(() => {
  "use strict";

  function initializeChatbot() {
    if (document.getElementById("ct-chat")) return;

    const endpoint =
      "https://ct-chatbot-backend.onrender.com/api/chat";

    const searchIcon = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <circle cx="10.5" cy="10.5" r="6.5"></circle>
        <path d="m16 16 5 5"></path>
      </svg>
    `;

    // Build the floating button and chat window.
    const widget = document.createElement("div");
    widget.id = "ct-chat";

    widget.innerHTML = `
      <button
        class="ct-chat-float"
        type="button"
        aria-label="Ask our chatbot anything"
        aria-controls="ct-chat-panel"
        aria-expanded="false"
        hidden
      >
        ${searchIcon}
        <span>Ask us anything</span>
      </button>

      <section
        id="ct-chat-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="ct-chat-title"
        hidden
      >
        <header class="ct-chat-top">
          <div>
            <p>C&amp;T PRODUCTIONS</p>
            <h2 id="ct-chat-title">Ask us anything.</h2>
          </div>

          <button
            type="button"
            class="ct-chat-close"
            aria-label="Close chat"
          >
            ×
          </button>
        </header>

        <p class="ct-chat-note">
          AI assistant · Packages, services, and your next project.
        </p>

        <div
          class="ct-chat-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          tabindex="0"
          aria-label="Conversation"
        ></div>

        <p class="ct-chat-status" role="status"></p>

        <form class="ct-chat-form">
          <label for="ct-chat-input" class="ct-chat-sr">
            Your question
          </label>

          <input
            id="ct-chat-input"
            name="message"
            type="text"
            placeholder="What would you like to know?"
            maxlength="2000"
            required
            autocomplete="off"
          >

          <button type="submit" aria-label="Send message">
            ↑
          </button>
        </form>

        <p class="ct-chat-foot">
          AI can make mistakes. Confirm project details with our team.
        </p>
      </section>
    `;

    document.body.append(widget);

    const panel = widget.querySelector("#ct-chat-panel");
    const floatingButton = widget.querySelector(".ct-chat-float");
    const closeButton = widget.querySelector(".ct-chat-close");
    const form = widget.querySelector(".ct-chat-form");
    const input = widget.querySelector("#ct-chat-input");
    const sendButton = form.querySelector("button");
    const messages = widget.querySelector(".ct-chat-messages");
    const status = widget.querySelector(".ct-chat-status");

    const contactLink = document.querySelector(
      ".site-header .header-contact"
    );

    let headerButton = null;
    let previousFocus = null;
    let sessionId = null;
    let sending = false;

    // Add the magnifying-glass button beside Contact.
    if (contactLink) {
      const headerActions = document.createElement("div");
      headerActions.className = "ct-chat-actions";

      contactLink.before(headerActions);

      headerButton = document.createElement("button");
      headerButton.type = "button";
      headerButton.className = "ct-chat-header-button";

      headerButton.setAttribute(
        "aria-label",
        "Ask our chatbot anything"
      );
      headerButton.setAttribute("aria-controls", "ct-chat-panel");
      headerButton.setAttribute("aria-expanded", "false");
      headerButton.title = "Ask our chatbot anything";

      headerButton.innerHTML = `
        ${searchIcon}
        <span>Ask our chatbot anything</span>
      `;

      headerActions.append(headerButton, contactLink);
    }

    // Display messages as plain text.
    function addMessage(text, sender) {
      const message = document.createElement("p");

      message.className =
        `ct-chat-message ct-chat-${sender}`;

      message.textContent = text;

      messages.append(message);
      messages.scrollTop = messages.scrollHeight;
    }

    addMessage(
      "Welcome to C&T. Ask about our websites, packages, or how to get started.",
      "assistant"
    );

    // Reveal the floating button after a short scroll.
    function updateFloatingButton() {
      const shouldAppear = headerButton
        ? window.scrollY >= 120
        : true;

      floatingButton.hidden = !panel.hidden || !shouldAppear;
    }

    function updateExpandedState(isOpen) {
      floatingButton.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      if (headerButton) {
        headerButton.setAttribute(
          "aria-expanded",
          String(isOpen)
        );
      }
    }

    function openChat() {
      previousFocus = document.activeElement;
      panel.hidden = false;

      updateExpandedState(true);
      updateFloatingButton();

      input.focus();
    }

    function closeChat() {
      panel.hidden = true;

      updateExpandedState(false);
      updateFloatingButton();

      if (!floatingButton.hidden) {
        floatingButton.focus();
      } else if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    }

    floatingButton.addEventListener("click", openChat);
    closeButton.addEventListener("click", closeChat);

    if (headerButton) {
      headerButton.addEventListener("click", () => {
        if (panel.hidden) {
          openChat();
        } else {
          closeChat();
        }
      });
    }

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeChat();
      }
    });

    window.addEventListener(
      "scroll",
      updateFloatingButton,
      { passive: true }
    );

    updateFloatingButton();

    // Send questions to your Render backend.
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const question = input.value.trim();

      if (!question || sending) return;

      sending = true;
      sendButton.disabled = true;
      input.readOnly = true;

      addMessage(question, "user");

      input.value = "";
      status.textContent = "Thinking…";

      const controller = new AbortController();

      const timeout = window.setTimeout(() => {
        controller.abort();
      }, 70000);

      try {
        const payload = {
          message: question
        };

        if (sessionId) {
          payload.sessionId = sessionId;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          credentials: "omit"
        });

        if (!response.ok) {
          if (
            sessionId &&
            [400, 404, 410].includes(response.status)
          ) {
            sessionId = null;
          }

          if (response.status === 429) {
            throw new Error(
              "We’re receiving a lot of questions. Please try again shortly."
            );
          }

          throw new Error(
            "We couldn’t get a reply. Please try again in a moment."
          );
        }

        let data;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "The reply couldn’t be read. Please try again."
          );
        }

        if (
          typeof data.reply !== "string" ||
          !data.reply.trim()
        ) {
          throw new Error(
            "No reply arrived. Please try again."
          );
        }

        sessionId =
          typeof data.sessionId === "string"
            ? data.sessionId
            : null;

        addMessage(data.reply, "assistant");
        status.textContent = "";
      } catch (error) {
        if (error.name === "AbortError") {
          status.textContent =
            "The reply took too long. Please try again.";
        } else if (error instanceof TypeError) {
          status.textContent =
            "Unable to connect. Check your connection and try again.";
        } else {
          status.textContent =
            error.message ||
            "Something went wrong. Please try again.";
        }

        // Restore the question so the visitor can retry.
        input.value = question;
      } finally {
        window.clearTimeout(timeout);

        sending = false;
        sendButton.disabled = false;
        input.readOnly = false;

        if (
          !panel.hidden &&
          panel.contains(document.activeElement)
        ) {
          input.focus();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeChatbot,
      { once: true }
    );
  } else {
    initializeChatbot();
  }
})();