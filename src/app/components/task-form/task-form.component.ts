import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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
export class TaskFormComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() createTask = new EventEmitter<Omit<Task, 'id'>>();
  @Output() updateTask = new EventEmitter<Task>();
  @Input() error: string | null = null;
  @Input() isEditMode = false;
  @Input() taskToEdit: Task | null = null;

  task: Omit<Task, 'id'> = {
    title: '',
    description: '',
    status: 'pending'
  };

  validationError: string | null = null; // Variable to store validation error messages

  ngOnInit(): void {
    // If in edit mode and a task is provided, initialize the form with task data
    if (this.isEditMode && this.taskToEdit) {
      this.task = {
        title: this.taskToEdit.title,
        description: this.taskToEdit.description,
        status: this.taskToEdit.status
      };
    }
  }

  onSubmit(): void {
    // Validate that title and description are not empty
    if (!this.task.title.trim() || !this.task.description.trim()) {
      this.validationError = 'The title and description cannot be empty. Please provide a title and description for the task.';
      return;
    }

    this.validationError = null; // Clear validation error if inputs are valid

    if (this.isEditMode && this.taskToEdit) {
      // In edit mode, emit the update event with the full task including ID
      this.updateTask.emit({
        id: this.taskToEdit.id,
        ...this.task
      });
    } else {
      // In create mode, emit the create event
      this.createTask.emit(this.task);
    }
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}
