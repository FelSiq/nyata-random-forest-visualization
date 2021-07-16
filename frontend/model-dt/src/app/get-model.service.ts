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
  private urlResourceGetModel = 'http://127.0.0.1:5000/dt-visualization';
  private urlResourceGetInfo = 'http://127.0.0.1:5000/session-information';

  constructor(private httpClient: HttpClient) { }

  getDTModel(): Observable<DTInterface> {
    return this.httpClient.get<DTInterface>(this.urlResourceGetModel, httpOptions)
      .pipe(
        retry(3),
      	catchError(this.handleError)
      );
  }

   getDTInfo() {
    return this.httpClient.get(this.urlResourceGetInfo, httpOptions)
      .pipe(
        retry(3),
      	catchError(this.handleError)
      );
  }

  destroy() {
    this.httpClient.delete(this.urlResourceGetModel, httpOptions).subscribe();
    this.httpClient.delete(this.urlResourceGetInfo, httpOptions).subscribe();

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
