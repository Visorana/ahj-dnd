// Manages the task manager functionality.
export default class TaskManager {
  constructor(element) {
    this.taskManager = element;
    this.columns = element.querySelectorAll(".task-list");
    this.addButton = element.querySelectorAll(".add-button");
    this.tasks = [
      ["Welcome to Task Manager!", "This is a card."],
      ["Try dragging cards anywhere.", "Finished with a card? Delete it."],
      ["Make as many lists as you need!"],
    ];
    this.form = null;
    this.draggedElem = null;
    this.ghostElem = null;
  }

  // Initializes the task manager by attaching event listeners.
  init() {
    document.addEventListener("DOMContentLoaded", this.loadState.bind(this));
    [...this.addButton].forEach((element) =>
      element.addEventListener("click", this.openForm.bind(this)),
    );
    [...this.columns].forEach((element) =>
      element.addEventListener("mousedown", this.onMouseDown.bind(this)),
    );
    document.documentElement.addEventListener(
      "mouseup",
      this.onMouseUp.bind(this),
    );
    document.documentElement.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
    );
  }

  // Loads the saved state from local storage.
  loadState() {
    const savedState = localStorage.getItem("taskManagerState");
    if (savedState) {
      this.tasks = JSON.parse(savedState);
    }
    this.render();
  }

  // Saves the current state to local storage.
  saveState() {
    localStorage.setItem("taskManagerState", JSON.stringify(this.tasks));
  }

  // Renders the tasks onto the task list columns.
  render() {
    this.columns.forEach((column) => (column.innerHTML = ""));
    this.tasks.forEach((column, columnIndex) => {
      column.forEach((item) => {
        this.columns[columnIndex].insertAdjacentHTML(
          "beforeend",
          `
          <li class="task-item">
            <div class="task-wrap">
              <p>${item}</p>
              <button class="task-remove">×</button>
            </div>
          </li>
        `,
        );
      });
    });
    const removeButtons = this.taskManager.querySelectorAll(".task-remove");
    [...removeButtons].forEach((element) =>
      element.addEventListener("click", this.removeTask.bind(this)),
    );
  }

  // Opens the form for adding a new task.
  openForm(e) {
    e.preventDefault();
    const btn = e.target;
    const hiddenBtn = document.querySelector(".add-button.hidden");
    if (hiddenBtn) {
      this.form.remove();
      hiddenBtn.classList.remove("hidden");
    }
    this.form = document.createElement("form");
    this.form.classList.add("task-form");
    this.form.innerHTML = `
      <textarea class="form-textarea" placeholder="Enter a title for this card..." required"></textarea>
      <div class="form-controls">
      <input type="submit" class="form-submit" value="Add card"></input>
        <button class="form-close">×</div>
      </div>`;
    btn.classList.add("hidden");
    btn.after(this.form);
    const closeFormElement = this.form.querySelector(".form-close");
    this.form.addEventListener("submit", this.createTask.bind(this));
    closeFormElement.addEventListener("click", this.closeForm.bind(this));
  }

  // Closes the task creation form.
  closeForm(e) {
    e.preventDefault();
    const btn = this.form.previousElementSibling;
    btn.classList.remove("hidden");
    this.form.remove();
  }

  // Creates a new task based on the input in the form.
  createTask(e) {
    e.preventDefault();
    const textArea = this.form.querySelector(".form-textarea");
    const taskTitle = textArea.value.trim();
    if (!taskTitle || /^\s+$/.test(taskTitle)) {
      textArea.setCustomValidity("Please enter a title.");
      textArea.reportValidity();
    } else {
      const currentColumn = this.form.parentElement.querySelector(".task-list");
      const columnIndex = [...this.columns].findIndex(
        (column) => column === currentColumn,
      );
      this.tasks[columnIndex].push(taskTitle);
      this.saveState();
      this.render();
      this.closeForm(e);
    }
    textArea.addEventListener("input", () => textArea.setCustomValidity(""));
    setTimeout(() => {
      textArea.setCustomValidity("");
    }, 3000);
  }

  // Removes a task when the remove button is clicked.
  removeTask(e) {
    e.preventDefault();
    const btn = e.target;
    const taskText = btn.parentElement.querySelector("p").textContent.trim();
    const column = btn.closest(".task-list");
    const columnIndex = [...this.columns].indexOf(column);

    const taskIndex = this.tasks[columnIndex].indexOf(taskText);
    if (taskIndex !== -1) {
      this.tasks[columnIndex].splice(taskIndex, 1);
      this.saveState();
      this.render();
    }
  }

  // Handles the mouse down event when starting to drag a task.
  onMouseDown(e) {
    if (e.button !== 0 || e.target.classList.contains("task-remove")) return;
    const task = e.target.closest(".task-item");
    if (task) {
      this.draggedElem = task;
      this.draggedElem.style.width = `${this.draggedElem.clientWidth}px`;
      this.saveMousePosition(e);

      this.ghostElem = this.createGhostElem();
      this.draggedElem.insertAdjacentElement("beforebegin", this.ghostElem);
      this.draggedElem.classList.add("dragged");
      document.body.classList.add("grab");

      this.moveDraggedElem(e);
      this.moveGhostElem(e);
    }
  }

  // Saves the mouse position relative to the dragged task.
  saveMousePosition(e) {
    const elemTop = this.draggedElem.getBoundingClientRect().top;
    const elemLeft = this.draggedElem.getBoundingClientRect().left;
    this.x = e.clientX - elemLeft;
    this.y = e.clientY - elemTop;
  }

  // Creates a ghost element for dragging.
  createGhostElem() {
    const ghostElem = document.createElement("div");
    ghostElem.style.width = `${this.draggedElem.clientWidth}px`;
    ghostElem.style.height = `${this.draggedElem.querySelector(".task-wrap").clientHeight}px`;
    ghostElem.classList.add("ghost-elem");
    return ghostElem;
  }

  // Moves the dragged task element.
  moveDraggedElem(e) {
    this.draggedElem.style.left = `${e.pageX - this.x}px`;
    this.draggedElem.style.top = `${e.pageY - this.y}px`;
  }

  // Moves the ghost element based on mouse position.
  moveGhostElem(e) {
    const elemFromPoint = document.elementFromPoint(e.clientX, e.clientY);
    if (!elemFromPoint) return;
    const closestTask = elemFromPoint.closest(".task-item");
    const closestTitle = elemFromPoint.closest(".column-title");
    const closestColumn = elemFromPoint.closest(".column");
    const closestGhost = elemFromPoint.closest(".ghost-elem");
    if (closestTask) {
      const elemHeight = closestTask.offsetHeight;
      const elemTop = closestTask.getBoundingClientRect().top;
      const yPosition = e.clientY - elemTop;
      closestTask.insertAdjacentElement(
        yPosition < elemHeight / 2 ? "beforebegin" : "afterend",
        this.ghostElem,
      );
    } else if (closestTitle) {
      closestTitle.nextElementSibling.insertAdjacentElement(
        "afterbegin",
        this.ghostElem,
      );
    } else if (closestColumn && !closestGhost) {
      const container = closestColumn.querySelector(".task-list");
      container.appendChild(this.ghostElem);
    } else if (!closestGhost) {
      this.draggedElem.before(this.ghostElem);
    }
  }

  // Handles the mouse move event during dragging.
  onMouseMove(e) {
    if (!this.draggedElem) return;
    e.preventDefault();
    this.moveDraggedElem(e);
    this.moveGhostElem(e);
  }

  // Handles the mouse up event when finishing dragging.
  onMouseUp() {
    if (!this.draggedElem) return;
    if (document.body.contains(this.ghostElem)) {
      const columnIndex = [...this.columns].findIndex((column) =>
        column.contains(this.draggedElem),
      );
      const taskIndex = [
        ...this.columns[columnIndex].querySelectorAll(".task-item"),
      ].indexOf(this.draggedElem);
      const task = this.tasks[columnIndex].splice(taskIndex, 1)[0];

      const targetColumnIndex = [...this.columns].findIndex((column) =>
        column.contains(this.ghostElem),
      );
      const targetTaskIndex = Array.from(
        this.columns[targetColumnIndex].children,
      ).indexOf(this.ghostElem);
      this.tasks[targetColumnIndex].splice(targetTaskIndex, 0, task);

      this.ghostElem.replaceWith(this.draggedElem);
      this.ghostElem.remove();
      this.draggedElem.classList.remove("dragged");
      this.ghostElem = null;
      this.draggedElem = null;
      document.body.classList.remove("grab");
      this.saveState();
      this.render();
    }
  }
}
