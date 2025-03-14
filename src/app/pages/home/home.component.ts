import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Task } from '../../models/task.model';

import { TaksService } from '../../services/taks.service';

import { TaskFormComponent } from '../../components/task-form/task-form.component';

// Define un tipo para los posibles filtros de estado
type StatusFilter = 'all' | 'completed' | 'pending';

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
  isEditMode = signal<boolean>(false);
  taskToEdit = signal<Task | null>(null);

  // Status filter signal
  statusFilter = signal<StatusFilter>('all');

  // Pagination signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Computed values
  totalTasks = computed(() => this.allTasks().length);
  completedTasks = computed(() => this.allTasks().filter(task => task.status === 'completed').length);
  pendingTasks = computed(() => this.allTasks().filter(task => task.status !== 'completed').length);

  // Filtered tasks based on search term and status filter
  filteredTasks = computed(() => {
    const searchTerm = this.searchTerm().toLowerCase();

    return this.allTasks().filter(task => {
      // First apply status filter
      if (this.statusFilter() === 'completed' && task.status !== 'completed') {
        return false;
      }
      if (this.statusFilter() === 'pending' && task.status === 'completed') {
        return false;
      }

      // Then apply search term filter
      if (searchTerm) {
        return task.title.toLowerCase().includes(searchTerm) ||
               task.description.toLowerCase().includes(searchTerm);
      }

      return true;
    });
  });

  // Pagination computed values
  totalPages = computed(() => Math.ceil(this.filteredTasks().length / this.pageSize()));
  paginatedTasks = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredTasks().slice(startIndex, endIndex);
  });

  hasPreviousPage = computed(() => this.currentPage() > 1);
  hasNextPage = computed(() => this.currentPage() < this.totalPages());

  ngOnInit(): void {
    this.loadTasks();
  }

  // =============== Filter Methods ===============
  applyStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    // Reset to first page when filtering
    this.currentPage.set(1);
  }

  filterTasks(term: string): void {
    this.searchTerm.set(term);
    // Reset to first page when filtering
    this.currentPage.set(1);
  }

  // =============== Pagination Methods ===============
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update(page => page + 1);
    }
  }

  // =============== CREATE Operations ===============
  openModal(): void {
    this.showModal.set(true);
    this.modalError.set(null);
    this.isEditMode.set(false);
    this.taskToEdit.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalError.set(null);
    this.error.set(null);
    this.isEditMode.set(false);
    this.taskToEdit.set(null);
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
        // Reset to first page when loading tasks
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load tasks. Please try again later.');
        this.isLoading.set(false);
        console.error('Error loading tasks:', error);
      }
    });
  }

  // =============== UPDATE Operations ===============
  openEditModal(task: Task): void {
    this.taskToEdit.set(task);
    this.isEditMode.set(true);
    this.showModal.set(true);
    this.modalError.set(null);
  }

  updateExistingTask(task: Task): void {
    this.modalError.set(null);

    this.taskService.updateTask(task.id, task).subscribe({
      next: (updatedTask) => {
        this.updateTasksList(updatedTask.id, updatedTask);
        this.closeModal();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.modalError.set(error.message || 'Failed to update task. Please try again.');
      }
    });
  }

  completeTask(id: string | number): void {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    this.updateTaskStatus(id, newStatus);
  }

  private updateTaskStatus(id: string | number, newStatus: string): void {
    this.taskService.updateTask(id, { status: newStatus }).subscribe({
      next: (updatedTask) => {
        this.updateTasksList(id, { status: newStatus });
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.error.set('Failed to update task status. Please try again.');
      }
    });
  }

  // =============== DELETE Operations ===============
  deleteTask(id: string | number): void {
    this.error.set(null); // Clear any previous errors

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

  private removeTaskFromLists(id: string | number): void {
    this.tasks.update(tasks => tasks.filter(t => t.id !== id));
    this.allTasks.update(tasks => tasks.filter(t => t.id !== id));
  }

  private updateTasksList(id: string | number, changes: Partial<Task>): void {
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
