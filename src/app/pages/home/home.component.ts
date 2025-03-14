import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TaksService } from '../../services/taks.service';

import { Task } from '../../models/task.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  tasks = signal<Task[]>([]);
  allTasks = signal<Task[]>([]);
  searchTerm = signal<string>('');

  totalTasks = computed(() => this.allTasks().length);
  pendingTasks = computed(() => this.allTasks().filter(task =>
    task.status === 'pending' || task.status === 'complete'
  ).length);

  private taskService = inject(TaksService);

  ngOnInit() {
    this.getTasks();
  }

  private getTasks() {
    this.taskService.getTask().subscribe({
      next: (tasks) => {
        const normalizedTasks = tasks.map(task => ({
          ...task,
          status: task.status === 'complete' ? 'completed' : task.status
        }));
        this.allTasks.set(normalizedTasks);
        this.tasks.set(normalizedTasks);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  filterTasks(term: string) {
    this.searchTerm.set(term);
    const searchTerm = term.toLowerCase();
    const filtered = this.allTasks().filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm)
    );
    this.tasks.set(filtered);
  }

  completeTask(id: number) {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    this.taskService.updateTask(id, { status: newStatus }).subscribe(() => {
      this.tasks.update(tasks =>
        tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
      );
      this.allTasks.update(tasks =>
        tasks.map(t => t.id === id ? { ...t, status: newStatus } : t)
      );
    });
  }

  deleteTask(id: number) {
    this.taskService.removeTask(id).subscribe(() => {
      this.tasks.update(tasks => tasks.filter(t => t.id !== id));
      this.allTasks.update(tasks => tasks.filter(t => t.id !== id));
    });
  }
}
