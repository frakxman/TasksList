import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TaksService } from './taks.service';
import { Task } from '../models/task.model';

describe('TaksService', () => {
  let service: TaksService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/tasks';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaksService]
    });
    service = TestBed.inject(TaksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTask', () => {
    it('should return all tasks', () => {
      const mockTasks: Task[] = [
        { id: 1, title: 'Task 1', description: 'Description 1', status: 'pending' },
        { id: 2, title: 'Task 2', description: 'Description 2', status: 'completed' }
      ];

      service.getTask().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
        expect(tasks.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('getOneTask', () => {
    it('should return a single task by id', () => {
      const mockTasks: Task[] = [
        { id: 1, title: 'Task 1', description: 'Description 1', status: 'pending' },
        { id: 2, title: 'Task 2', description: 'Description 2', status: 'completed' }
      ];
      const taskId = 1;

      service.getOneTask(taskId).subscribe(task => {
        expect(task).toEqual(mockTasks[0]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should return undefined if task not found', () => {
      const mockTasks: Task[] = [
        { id: 1, title: 'Task 1', description: 'Description 1', status: 'pending' }
      ];
      const taskId = 999;

      service.getOneTask(taskId).subscribe(task => {
        expect(task).toBeUndefined();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const mockTasks: Task[] = [];
      const newTask = { title: 'New Task', description: 'New Description', status: 'pending' };
      const createdTask: Task = { id: 1, ...newTask };

      // First, mock the getTask call to check for duplicates
      service.createTask(newTask).subscribe(task => {
        expect(task).toEqual(createdTask);
      });

      // Handle the getTask request first
      const getReq = httpMock.expectOne(apiUrl);
      expect(getReq.request.method).toBe('GET');
      getReq.flush(mockTasks);

      // Then handle the POST request
      const postReq = httpMock.expectOne(apiUrl);
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual(newTask);
      postReq.flush(createdTask);
    });

    it('should throw error if task with same title exists', () => {
      const existingTitle = 'Existing Task';
      const mockTasks: Task[] = [
        { id: 1, title: existingTitle, description: 'Description', status: 'pending' }
      ];
      const newTask = { title: existingTitle, description: 'New Description', status: 'pending' };

      service.createTask(newTask).subscribe({
        next: () => fail('should have failed with duplicate title error'),
        error: (error) => {
          expect(error.message).toContain('already exists');
        }
      });

      // Handle the getTask request
      const getReq = httpMock.expectOne(apiUrl);
      expect(getReq.request.method).toBe('GET');
      getReq.flush(mockTasks);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const taskId = 1;
      const changes = { title: 'Updated Title' };
      const updatedTask: Task = {
        id: taskId,
        title: 'Updated Title',
        description: 'Description',
        status: 'pending'
      };

      service.updateTask(taskId, changes).subscribe(task => {
        expect(task).toEqual(updatedTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(changes);
      req.flush(updatedTask);
    });
  });

  describe('removeTask', () => {
    it('should delete a task', () => {
      const taskId = 1;

      service.removeTask(taskId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('normalizeString and isDuplicateTitle', () => {
    it('should normalize strings correctly', () => {
      // Access private method using type assertion
      const normalizeString = (service as any).normalizeString.bind(service);

      expect(normalizeString('  Test String  ')).toBe('test string');
      expect(normalizeString('UPPERCASE')).toBe('uppercase');
      expect(normalizeString(' mixed CASE ')).toBe('mixed case');
    });

    it('should detect duplicate titles correctly', () => {
      // Access private method using type assertion
      const isDuplicateTitle = (service as any).isDuplicateTitle.bind(service);

      const tasks: Task[] = [
        { id: 1, title: 'Task One', description: 'Description', status: 'pending' },
        { id: 2, title: 'Task Two', description: 'Description', status: 'pending' }
      ];

      const newTask1 = { title: 'Task One', description: 'New Description', status: 'pending' };
      const newTask2 = { title: '  task one  ', description: 'New Description', status: 'pending' };
      const newTask3 = { title: 'TASK ONE', description: 'New Description', status: 'pending' };
      const newTask4 = { title: 'Task Three', description: 'New Description', status: 'pending' };

      expect(isDuplicateTitle(tasks, newTask1)).toBeTrue();
      expect(isDuplicateTitle(tasks, newTask2)).toBeTrue();
      expect(isDuplicateTitle(tasks, newTask3)).toBeTrue();
      expect(isDuplicateTitle(tasks, newTask4)).toBeFalse();
    });
  });
});
