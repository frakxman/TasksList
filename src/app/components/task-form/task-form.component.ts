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
    if (this.task.title && this.task.description) {
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
  }

  onCancel(): void {
    this.closeModal.emit();
  }
}
