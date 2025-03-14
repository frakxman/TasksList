import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Output() createTask = new EventEmitter<Omit<Task, 'id'>>();
  @Input() error: string | null = null;

  task: Omit<Task, 'id'> = {
    title: '',
    description: '',
    status: 'pending'
  };

  onSubmit(): void {
    if (this.task.title && this.task.description) {
      this.createTask.emit(this.task);
    }
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}
