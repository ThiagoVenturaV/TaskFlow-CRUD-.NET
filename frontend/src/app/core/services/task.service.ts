import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum TaskItemStatus {
  Pending = 0,
  InProgress = 1,
  Done = 2,
  Cancelled = 3
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: TaskItemStatus;
  statusLabel: string;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  userName: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tasks';

  getAll(userId?: string): Observable<TaskItem[]> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    return this.http.get<TaskItem[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.apiUrl}/${id}`);
  }

  create(task: any): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, task);
  }

  update(id: string, task: any): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.apiUrl}/${id}`, task);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignToUser(taskId: string, userId: string): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.apiUrl}/${taskId}/assign/${userId}`, {});
  }
}
