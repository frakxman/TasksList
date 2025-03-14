import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { Observable, map, of, throwError, switchMap } from 'rxjs';

/**
 * Task Service
 *
 * This service handles all task-related operations including fetching, creating,
 * updating, and deleting tasks. It communicates with a backend API that only
 * supports collection-level operations (no individual task endpoints).
 */
@Injectable({
  providedIn: 'root'
})
export class TaksService {
  /** Base API URL for tasks */
  private apiUrl = 'http://localhost:3000/tasks';

  constructor(private http: HttpClient) {}

  /**
   * Fetches all tasks from the server
   *
   * @returns An Observable that emits an array of Task objects
   */
  getTask(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  /**
   * Retrieves a single task by its ID
   *
   * Since the API doesn't support individual task endpoints, this method
   * fetches all tasks and filters locally to find the requested task.
   *
   * @param id - The ID of the task to retrieve
   * @returns An Observable that emits the found Task or undefined if not found
   */
  getOneTask(id: number): Observable<Task | undefined> {
    return this.getTask().pipe(
      map(tasks => tasks.find(task => task.id === id))
    );
  }

  /**
   * Normalizes a string for comparison by trimming whitespace and converting to lowercase
   *
   * @param str - The string to normalize
   * @returns The normalized string
   */
  private normalizeString(str: string): string {
    return str.trim().toLowerCase();
  }

  /**
   * Checks if a task with the same title already exists
   *
   * @param tasks - The list of existing tasks
   * @param task - The task to check for duplicates
   * @returns True if a task with the same title exists, false otherwise
   */
  private isDuplicateTitle(tasks: Task[], task: Omit<Task, 'id'>): boolean {
    const normalizedTitle = this.normalizeString(task.title);

    return tasks.some(existingTask => {
      const existingTitle = this.normalizeString(existingTask.title);
      return existingTitle === normalizedTitle;
    });
  }

  /**
   * Creates a new task
   *
   * @param task - The task data to create (without ID)
   * @returns An Observable that emits the created Task with its assigned ID
   * @throws Error if a task with the same title already exists
   */
  createTask(task: Omit<Task, 'id'>): Observable<Task> {
    // First check if a task with the same title exists
    return this.getTask().pipe(
      switchMap(tasks => {
        // Check for duplicate title
        if (this.isDuplicateTitle(tasks, task)) {
          return throwError(() => new Error('A task with this title already exists. Please use a different title.'));
        }

        // If no duplicate, create the task
        return this.http.post<Task>(this.apiUrl, task);
      })
    );
  }

  /**
   * Updates an existing task
   *
   * Since the API doesn't support individual task endpoints, this method
   * fetches all tasks, updates the specific one locally, and then sends
   * the entire updated collection back to the server.
   *
   * @param id - The ID of the task to update
   * @param changes - The partial Task object containing the properties to update
   * @returns An Observable that emits the updated Task
   * @throws Error if the task with the specified ID is not found
   * @throws Error if the update would create a duplicate title
   */
  updateTask(id: number, changes: Partial<Task>): Observable<Task> {
    // First get all tasks
    return this.getTask().pipe(
      map(tasks => {
        // Find the task to update
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
          throw new Error(`Task with id ${id} not found`);
        }

        // Create an updated version of the task
        const updatedTask = { ...tasks[taskIndex], ...changes };

        // Only check for duplicate title if the title is being changed
        if (changes.title) {
          // Check if this update would create a duplicate title (excluding the current task)
          const otherTasks = tasks.filter(t => t.id !== id);
          if (this.isDuplicateTitle(otherTasks, updatedTask)) {
            throw new Error('A task with this title already exists. Please use a different title.');
          }
        }

        // Create a new list with the updated task
        const updatedTasks = [...tasks];
        updatedTasks[taskIndex] = updatedTask;

        // Send the complete updated list to the server
        this.http.put(this.apiUrl, updatedTasks).subscribe();

        // Return the updated task
        return updatedTask;
      })
    );
  }

  /**
   * Removes a task by ID
   *
   * Since the API doesn't support individual task endpoints, this method
   * fetches all tasks, removes the specific one locally, and then sends
   * the entire updated collection back to the server.
   *
   * @param id - The ID of the task to remove
   * @returns An Observable that completes when the operation is finished
   */
  removeTask(id: number): Observable<void> {
    // First get all tasks
    return this.getTask().pipe(
      map(tasks => {
        // Filter out the task to remove
        const filteredTasks = tasks.filter(task => task.id !== id);

        // Send the updated list to the server
        this.http.put(this.apiUrl, filteredTasks).subscribe();
      })
    );
  }
}
