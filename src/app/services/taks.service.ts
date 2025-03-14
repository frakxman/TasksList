import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaksService {

  private readonly urlApi = 'http://localhost:3000/tasks';

  private http = inject(HttpClient);

  getTask() {
    return this.http.get<Task[]>(`${this.urlApi}`);
  }

  getOneTask(id: number) {
    this.http.get<Task>(`${this.urlApi}/${id}`);
  }

  createTask(task: Task) {
    return this.http.post<Task>(`${this.urlApi}`, task);
  }

  updateTask(id: number, changes: Partial<Task>) {
    return this.http.patch<Task>(`${this.urlApi}/${id}`, changes);
  }

  removeTask(id: number) {
    return this.http.delete(`${this.urlApi}/${id}`);
  }
}
