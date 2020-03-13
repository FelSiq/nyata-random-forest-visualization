import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { DTInterface } from './dt-interface';

const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class GetModelService {
  private urlResource = 'http://127.0.0.1:5000/dt-visualization';

  constructor(private httpClient: HttpClient) { }

  getDTModel(): Observable<DTInterface> {
    return this.httpClient.get<DTInterface>(this.urlResource, httpOptions)
      .pipe(
        retry(3),
      	catchError(this.handleError)
      );
  }

  destroy() {
    this.httpClient.delete(this.urlResource, httpOptions).subscribe();
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    return throwError(
      'Something went wrong.');
    }
}
