import { Component, EventEmitter, Output } from '@angular/core';
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

  task = {
    title: '',
    description: '',
    status: 'pending'
  };

  onSubmit() {
    if (this.task.title.trim() && this.task.description.trim()) {
      this.createTask.emit(this.task);
      this.closeModal.emit();
    }
  }

  onCancel() {
    this.closeModal.emit();
  }
}
