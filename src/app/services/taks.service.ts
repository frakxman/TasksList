import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { Observable, map, of, throwError, switchMap, catchError, tap } from 'rxjs';

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
   * @param id - The ID of the task to update
   * @param changes - The partial Task object containing the properties to update
   * @returns An Observable that emits the updated Task
   */
  updateTask(id: string | number, changes: Partial<Task>): Observable<Task> {
    // Send the updated task to the server
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, changes).pipe(
      catchError(error => {
        console.error('Error updating task:', error);
        return throwError(() => new Error('Failed to update task. Server error.'));
      })
    );
  }

  /**
   * Removes a task by ID
   *
   * @param id - The ID of the task to remove
   * @returns An Observable that completes when the operation is finished
   */
  removeTask(id: string | number): Observable<void> {
    // Use DELETE method directly on the specific task endpoint
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error removing task:', error);
        return throwError(() => new Error('Failed to remove task. Server error.'));
      })
    );
  }
}
