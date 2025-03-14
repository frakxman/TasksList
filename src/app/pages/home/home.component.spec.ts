import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { HomeComponent } from './home.component';
import { TaskFormComponent } from '../../components/task-form/task-form.component';
import { TaksService } from '../../services/taks.service';
import { Task } from '../../models/task.model';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaksService>;

  // Mock data
  const mockTasks: Task[] = [
    { id: 1, title: 'Task 1', description: 'Description 1', status: 'pending' },
    { id: 2, title: 'Task 2', description: 'Description 2', status: 'completed' },
    { id: 3, title: 'Task 3', description: 'Description 3', status: 'pending' },
    { id: 4, title: 'Task 4', description: 'Description 4', status: 'completed' },
    { id: 5, title: 'Task 5', description: 'Description 5', status: 'pending' },
  ];

  beforeEach(async () => {
    // Create a spy for the TaskService
    const spy = jasmine.createSpyObj('TaksService', [
      'getTask', 'getOneTask', 'createTask', 'updateTask', 'removeTask'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        TaskFormComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        { provide: TaksService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    taskServiceSpy = TestBed.inject(TaksService) as jasmine.SpyObj<TaksService>;

    // Setup default spy behavior
    taskServiceSpy.getTask.and.returnValue(of(mockTasks));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load tasks on init', () => {
      expect(taskServiceSpy.getTask).toHaveBeenCalled();
      expect(component.allTasks().length).toBe(mockTasks.length);
    });

    it('should initialize with default values', () => {
      expect(component.searchTerm()).toBe('');
      expect(component.showModal()).toBeFalse();
      expect(component.isLoading()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.modalError()).toBeNull();
      expect(component.isEditMode()).toBeFalse();
      expect(component.taskToEdit()).toBeNull();
      expect(component.statusFilter()).toBe('all');
      expect(component.currentPage()).toBe(1);
      expect(component.pageSize()).toBe(10);
    });

    it('should display error message when loading tasks fails', () => {
      // Reset the component
      component = fixture.componentInstance;

      // Setup error response
      taskServiceSpy.getTask.and.returnValue(throwError(() => new Error('Failed to load tasks')));

      // Trigger initialization
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.error()).not.toBeNull();
      expect(component.isLoading()).toBeFalse();

      // Check if error message is displayed
      const errorElement = fixture.debugElement.query(By.css('.bg-red-500\\/20'));
      expect(errorElement).not.toBeNull();
    });
  });

  describe('Computed values', () => {
    it('should calculate totalTasks correctly', () => {
      expect(component.totalTasks()).toBe(mockTasks.length);
    });

    it('should calculate completedTasks correctly', () => {
      const completedCount = mockTasks.filter(t => t.status === 'completed').length;
      expect(component.completedTasks()).toBe(completedCount);
    });

    it('should calculate pendingTasks correctly', () => {
      const pendingCount = mockTasks.filter(t => t.status !== 'completed').length;
      expect(component.pendingTasks()).toBe(pendingCount);
    });
  });

  describe('Filtering', () => {
    it('should filter tasks by search term', () => {
      component.filterTasks('Task 1');
      expect(component.filteredTasks().length).toBe(1);
      expect(component.filteredTasks()[0].title).toBe('Task 1');
    });

    it('should filter tasks by status', () => {
      component.applyStatusFilter('completed');
      expect(component.filteredTasks().length).toBe(2);
      expect(component.filteredTasks().every(t => t.status === 'completed')).toBeTrue();
    });

    it('should combine search and status filters', () => {
      component.applyStatusFilter('pending');
      component.filterTasks('Task 1');
      expect(component.filteredTasks().length).toBe(1);
      expect(component.filteredTasks()[0].title).toBe('Task 1');
      expect(component.filteredTasks()[0].status).toBe('pending');
    });

    it('should reset to page 1 when filtering', () => {
      component.currentPage.set(2);
      component.filterTasks('Task');
      expect(component.currentPage()).toBe(1);

      component.currentPage.set(2);
      component.applyStatusFilter('completed');
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Create more mock tasks for pagination testing
      const moreTasks: Task[] = [];
      for (let i = 6; i <= 15; i++) {
        moreTasks.push({
          id: i,
          title: `Task ${i}`,
          description: `Description ${i}`,
          status: i % 2 === 0 ? 'completed' : 'pending'
        });
      }

      const allMockTasks = [...mockTasks, ...moreTasks];
      taskServiceSpy.getTask.and.returnValue(of(allMockTasks));

      // Reinitialize component
      component.ngOnInit();
      component.pageSize.set(5); // Set page size to 5 for testing
      fixture.detectChanges();
    });

    it('should paginate tasks correctly', () => {
      expect(component.paginatedTasks().length).toBe(5);
      expect(component.paginatedTasks()[0].id).toBe(1);
      expect(component.paginatedTasks()[4].id).toBe(5);
    });

    it('should navigate to next page', () => {
      component.nextPage();
      expect(component.currentPage()).toBe(2);
      expect(component.paginatedTasks()[0].id).toBe(6);
    });

    it('should navigate to previous page', () => {
      component.nextPage();
      component.previousPage();
      expect(component.currentPage()).toBe(1);
    });

    it('should not navigate past the last page', () => {
      component.currentPage.set(component.totalPages());
      component.nextPage();
      expect(component.currentPage()).toBe(component.totalPages());
    });

    it('should not navigate before the first page', () => {
      component.currentPage.set(1);
      component.previousPage();
      expect(component.currentPage()).toBe(1);
    });

    it('should calculate total pages correctly', () => {
      expect(component.totalPages()).toBe(3); // 15 tasks with 5 per page = 3 pages
    });
  });

  describe('Task operations', () => {
    describe('Create task', () => {
      it('should open modal in create mode', () => {
        component.openModal();
        expect(component.showModal()).toBeTrue();
        expect(component.isEditMode()).toBeFalse();
        expect(component.taskToEdit()).toBeNull();
      });

      it('should create a new task', () => {
        const newTask = { title: 'New Task', description: 'New Description', status: 'pending' };
        const createdTask: Task = { id: 999, ...newTask };

        taskServiceSpy.createTask.and.returnValue(of(createdTask));

        component.createTask(newTask);

        expect(taskServiceSpy.createTask).toHaveBeenCalledWith(newTask);
        expect(component.showModal()).toBeFalse();

        // Check if task was added to the lists
        const allTasks = component.allTasks();
        expect(allTasks.some(t => t.id === createdTask.id)).toBeTrue();
      });

      it('should handle error when creating task', () => {
        const newTask = { title: 'New Task', description: 'New Description', status: 'pending' };
        const errorMessage = 'Failed to create task';

        taskServiceSpy.createTask.and.returnValue(throwError(() => new Error(errorMessage)));

        // Ensure modal is open before creating task
        component.showModal.set(true);
        component.createTask(newTask);

        expect(component.modalError()).toContain(errorMessage);
        expect(component.showModal()).toBeTrue(); // Modal should stay open
      });
    });

    describe('Edit task', () => {
      it('should open modal in edit mode with task data', () => {
        const taskToEdit = mockTasks[0];

        component.openEditModal(taskToEdit);

        expect(component.showModal()).toBeTrue();
        expect(component.isEditMode()).toBeTrue();
        expect(component.taskToEdit()).toEqual(taskToEdit);
      });

      it('should update an existing task', () => {
        const taskToUpdate: Task = {
          id: 1,
          title: 'Updated Task',
          description: 'Updated Description',
          status: 'completed'
        };

        taskServiceSpy.updateTask.and.returnValue(of(taskToUpdate));

        component.updateExistingTask(taskToUpdate);

        expect(taskServiceSpy.updateTask).toHaveBeenCalledWith(taskToUpdate.id, taskToUpdate);
        expect(component.showModal()).toBeFalse();

        // Check if task was updated in the lists
        const updatedTask = component.allTasks().find(t => t.id === taskToUpdate.id);
        expect(updatedTask).toEqual(taskToUpdate);
      });

      it('should handle error when updating task', () => {
        const taskToUpdate: Task = {
          id: 1,
          title: 'Updated Task',
          description: 'Updated Description',
          status: 'completed'
        };
        const errorMessage = 'Failed to update task';

        taskServiceSpy.updateTask.and.returnValue(throwError(() => new Error(errorMessage)));

        // Ensure modal is open before updating task
        component.showModal.set(true);
        component.updateExistingTask(taskToUpdate);

        expect(component.modalError()).toContain(errorMessage);
        expect(component.showModal()).toBeTrue(); // Modal should stay open
      });
    });

    describe('Complete task', () => {
      it('should toggle task status between completed and pending', () => {
        const taskId = 1;
        const task = mockTasks.find(t => t.id === taskId)!;
        const originalStatus = task.status;
        const newStatus = originalStatus === 'completed' ? 'pending' : 'completed';

        taskServiceSpy.updateTask.and.returnValue(of({ ...task, status: newStatus }));

        // Mock the tasks array to include the task
        component.tasks.set(mockTasks);

        component.completeTask(taskId);

        expect(taskServiceSpy.updateTask).toHaveBeenCalledWith(taskId, { status: newStatus });

        // Check if task status was updated in the lists
        const updatedTask = component.allTasks().find(t => t.id === taskId);
        expect(updatedTask?.status).toBe(newStatus);
      });
    });

    describe('Delete task', () => {
      it('should remove a task', () => {
        const taskId = 1;

        taskServiceSpy.removeTask.and.returnValue(of(undefined));

        component.deleteTask(taskId);

        expect(taskServiceSpy.removeTask).toHaveBeenCalledWith(taskId);

        // Check if task was removed from the lists
        expect(component.allTasks().some(t => t.id === taskId)).toBeFalse();
      });

      it('should handle error when deleting task', () => {
        const taskId = 1;
        const errorMessage = 'Failed to delete task';

        taskServiceSpy.removeTask.and.returnValue(throwError(() => new Error(errorMessage)));

        component.deleteTask(taskId);

        expect(component.error()).toContain('Failed to delete task');
      });
    });
  });

  describe('UI elements', () => {
    it('should display task count correctly', () => {
      const completedCount = mockTasks.filter(t => t.status === 'completed').length;
      const totalCount = mockTasks.length;

      fixture.detectChanges();

      const headerText = fixture.debugElement.query(By.css('header p')).nativeElement.textContent;
      expect(headerText).toContain(`${completedCount}`);
      expect(headerText).toContain(`${totalCount}`);
    });

    it('should display filter buttons with correct counts', () => {
      fixture.detectChanges();

      const filterButtons = fixture.debugElement.queryAll(By.css('.w-full.max-w-md.mb-6.flex button'));
      expect(filterButtons.length).toBe(3);

      const allButton = filterButtons[0].nativeElement;
      const pendingButton = filterButtons[1].nativeElement;
      const completedButton = filterButtons[2].nativeElement;

      expect(allButton.textContent).toContain(`All Tasks (${mockTasks.length})`);
      expect(pendingButton.textContent).toContain(`Pending (${component.pendingTasks()})`);
      expect(completedButton.textContent).toContain(`Completed (${component.completedTasks()})`);
    });

    it('should highlight the active filter button', () => {
      // Default is 'all'
      fixture.detectChanges();

      let filterButtons = fixture.debugElement.queryAll(By.css('.w-full.max-w-md.mb-6.flex button'));
      expect(filterButtons[0].nativeElement.classList).toContain('bg-teal-600');

      // Change to 'pending'
      component.applyStatusFilter('pending');
      fixture.detectChanges();

      filterButtons = fixture.debugElement.queryAll(By.css('.w-full.max-w-md.mb-6.flex button'));
      expect(filterButtons[1].nativeElement.classList).toContain('bg-teal-600');

      // Change to 'completed'
      component.applyStatusFilter('completed');
      fixture.detectChanges();

      filterButtons = fixture.debugElement.queryAll(By.css('.w-full.max-w-md.mb-6.flex button'));
      expect(filterButtons[2].nativeElement.classList).toContain('bg-green-600');
    });
  });
});
