document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

        const participantSection = document.createElement("div");
        participantSection.className = "participant-section";

        const participantHeading = document.createElement("h5");
        participantHeading.className = "participant-heading";
        participantHeading.textContent = `Participants (${details.participants.length})`;
        participantSection.appendChild(participantHeading);

        const participantList = document.createElement("ul");
        participantList.className = "participant-list";
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.className = "participant-row";

          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove";
          removeButton.textContent = "\u00d7";
          removeButton.title = `Unregister ${email} from ${name}`;
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              if (!response.ok) {
                const result = await response.json();
                messageDiv.textContent = result.detail || "Could not unregister participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                removeButton.disabled = false;
                return;
              }

              participant.remove();
              const remainingParticipants = participantList.querySelectorAll(".participant-row").length;
              participantHeading.textContent = `Participants (${remainingParticipants})`;
              activityCard.querySelector(".spots-left").textContent =
                Number(activityCard.querySelector(".spots-left").textContent) + 1;

              if (remainingParticipants === 0) {
                const emptyMessage = document.createElement("li");
                emptyMessage.className = "participant-empty";
                emptyMessage.textContent = "No participants yet";
                participantList.appendChild(emptyMessage);
              }
            } catch (error) {
              messageDiv.textContent = "Could not unregister participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              removeButton.disabled = false;
              console.error("Error removing participant:", error);
            }
          });
          participant.appendChild(removeButton);
          participantList.appendChild(participant);
        });
        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participant-empty";
          emptyMessage.textContent = "No participants yet";
          participantList.appendChild(emptyMessage);
        }
        participantSection.appendChild(participantList);
        activityCard.appendChild(participantSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
