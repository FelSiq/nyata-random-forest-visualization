import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { PredictResults } from '../predict-results';

const httpOptions = {
  withCredentials: true,
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};


@Injectable({
  providedIn: 'root',
})
export class TreePredictCallerService {
  private urlPostInstance = 'http://127.0.0.1:5000/predict-single-instance/';

  constructor(private httpClient: HttpClient) { }

  predictSingleInstance(instance: Array<number | string>): Observable<PredictResults> {
    return this.httpClient
      .get<PredictResults>(this.urlPostInstance + instance.toString(), httpOptions)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while predicting a single instance.
       Please check your instance values are correct.`);
    }

}
