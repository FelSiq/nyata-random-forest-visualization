import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { PredictResults } from '../predict-results';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({
  providedIn: 'root'
})
export class TreePredictCallerService {
  private url_post_instance = 'http://127.0.0.1:5000/predict-single-instance'

  constructor(private http: HttpClient) { }

  predictSingleInstance(instance: number[]): Observable<PredictResults> {
    return this.http.post<PredictResults>(this.url_post_instance, httpOptions)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
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
      'Something went wrong while predicting a single instance.');
    };

}
