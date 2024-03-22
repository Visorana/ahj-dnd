// Initializes the TaskManager class and sets up event listener.
import TaskManager from "./taskManager";

const taskManager = new TaskManager(document.querySelector(".task-manager"));
taskManager.init();
