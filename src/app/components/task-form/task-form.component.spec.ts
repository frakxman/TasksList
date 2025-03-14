import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { TaskFormComponent } from './task-form.component';
import { Task } from '../../models/task.model';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should initialize with default values', () => {
      expect(component.task).toBeDefined();
      expect(component.task.title).toBe('');
      expect(component.task.description).toBe('');
      expect(component.task.status).toBe('pending');
      expect(component.isEditMode).toBeFalse();
      expect(component.taskToEdit).toBeNull();
      expect(component.error).toBeNull();
    });

    it('should display "Create New Task" title when not in edit mode', () => {
      const titleElement = fixture.debugElement.query(By.css('h2')).nativeElement;
      expect(titleElement.textContent.trim()).toBe('Create New Task');
    });

    it('should display "Create Task" button when not in edit mode', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(submitButton.textContent.trim()).toBe('Create Task');
    });
  });

  describe('Edit mode', () => {
    const mockTask: Task = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      status: 'pending'
    };

    beforeEach(() => {
      component.isEditMode = true;
      component.taskToEdit = mockTask;
      component.ngOnInit(); // Trigger initialization with the mock task
      fixture.detectChanges();
    });

    it('should initialize form with task data in edit mode', () => {
      expect(component.task.title).toBe(mockTask.title);
      expect(component.task.description).toBe(mockTask.description);
      expect(component.task.status).toBe(mockTask.status);
    });

    it('should display "Edit Task" title in edit mode', () => {
      const titleElement = fixture.debugElement.query(By.css('h2')).nativeElement;
      expect(titleElement.textContent.trim()).toBe('Edit Task');
    });

    it('should display "Edit Task" button in edit mode', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(submitButton.textContent.trim()).toBe('Edit Task');
    });
  });

  describe('Form submission', () => {
    it('should not emit createTask if form is invalid', () => {
      spyOn(component.createTask, 'emit');
      component.onSubmit();
      expect(component.createTask.emit).not.toHaveBeenCalled();
    });

    it('should emit createTask with task data when form is valid in create mode', () => {
      spyOn(component.createTask, 'emit');

      // Set valid form data
      component.task = {
        title: 'New Task',
        description: 'New Description',
        status: 'pending'
      };

      component.onSubmit();
      expect(component.createTask.emit).toHaveBeenCalledWith(component.task);
    });

    it('should emit updateTask with task data when form is valid in edit mode', () => {
      spyOn(component.updateTask, 'emit');

      // Set up edit mode
      const mockTask: Task = {
        id: 1,
        title: 'Original Task',
        description: 'Original Description',
        status: 'pending'
      };

      component.isEditMode = true;
      component.taskToEdit = mockTask;

      // Update the task
      component.task = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'pending'
      };

      component.onSubmit();
      expect(component.updateTask.emit).toHaveBeenCalledWith({
        id: mockTask.id,
        ...component.task
      });
    });
  });

  describe('Cancel button', () => {
    it('should emit closeModal when cancel button is clicked', () => {
      spyOn(component.closeModal, 'emit');

      const cancelButton = fixture.debugElement.query(By.css('button[type="button"]'));
      cancelButton.triggerEventHandler('click', null);

      expect(component.closeModal.emit).toHaveBeenCalled();
    });
  });

  describe('Error display', () => {
    it('should not display error message when error is null', () => {
      component.error = null;
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.bg-red-500\\/20'));
      expect(errorElement).toBeNull();
    });

    it('should display error message when error is provided', () => {
      const errorMessage = 'Test error message';
      component.error = errorMessage;
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.bg-red-500\\/20')).nativeElement;
      expect(errorElement.textContent.trim()).toBe(errorMessage);
    });
  });
});
