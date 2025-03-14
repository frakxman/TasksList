import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Task } from '../../models/task.model';

import { TaksService } from '../../services/taks.service';

import { TaskFormComponent } from '../../components/task-form/task-form.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskFormComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  // State signals
  private readonly taskService = inject(TaksService);

  tasks = signal<Task[]>([]);
  allTasks = signal<Task[]>([]);
  searchTerm = signal<string>('');
  showModal = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  modalError = signal<string | null>(null);

  // Computed values
  totalTasks = computed(() => this.allTasks().length);
  completedTasks = computed(() => this.totalTasks() - this.pendingTasks());
  pendingTasks = computed(() => this.allTasks().filter(task =>
    task.status === 'pending' || task.status === 'complete'
  ).length);

  ngOnInit(): void {
    this.loadTasks();
  }

  // =============== CREATE Operations ===============
  openModal(): void {
    this.showModal.set(true);
    this.modalError.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalError.set(null);
    this.error.set(null);
  }

  createTask(task: Omit<Task, 'id'>): void {
    this.modalError.set(null);

    this.taskService.createTask(task).subscribe({
      next: (newTask) => {
        this.addTaskToList(newTask);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error creating task:', error);

        // Mostrar el mensaje de error exacto del servicio
        this.modalError.set(error.message || 'Failed to create task. Please try again.');
      }
    });
  }

  // =============== READ Operations ===============
  private loadTasks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.taskService.getTask().subscribe({
      next: (tasks) => {
        const normalizedTasks = this.normalizeTasks(tasks);
        this.allTasks.set(normalizedTasks);
        this.tasks.set(normalizedTasks);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load tasks. Please try again later.');
        this.isLoading.set(false);
        console.error('Error loading tasks:', error);
      }
    });
  }

  filterTasks(term: string): void {
    this.searchTerm.set(term);
    const searchTerm = term.toLowerCase();
    const filtered = this.allTasks().filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm)
    );
    this.tasks.set(filtered);
  }

  // =============== UPDATE Operations ===============
  completeTask(id: number): void {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.updateTaskStatus(id, newStatus);
  }

  private updateTaskStatus(id: number, newStatus: string): void {
    this.taskService.updateTask(id, { status: newStatus }).subscribe({
      next: () => {
        this.updateTasksList(id, { status: newStatus });
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.error.set('Failed to update task status. Please try again.');
      }
    });
  }

  // =============== DELETE Operations ===============
  deleteTask(id: number): void {
    this.taskService.removeTask(id).subscribe({
      next: () => {
        this.removeTaskFromLists(id);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.error.set('Failed to delete task. Please try again.');
      }
    });
  }

  // =============== Helper Methods ===============
  private normalizeTasks(tasks: Task[]): Task[] {
    return tasks.map(task => ({
      ...task,
      status: task.status === 'complete' ? 'completed' : task.status
    }));
  }

  private removeTaskFromLists(id: number): void {
    this.tasks.update(tasks => tasks.filter(t => t.id !== id));
    this.allTasks.update(tasks => tasks.filter(t => t.id !== id));
  }

  private updateTasksList(id: number, changes: Partial<Task>): void {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, ...changes } : t)
    );
    this.allTasks.update(tasks =>
      tasks.map(t => t.id === id ? { ...t, ...changes } : t)
    );
  }

  private addTaskToList(newTask: Task): void {
    this.tasks.update(tasks => [...tasks, newTask]);
    this.allTasks.update(tasks => [...tasks, newTask]);
  }
}
