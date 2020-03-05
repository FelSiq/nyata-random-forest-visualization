import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};


@Injectable({
  providedIn: 'root',
})
export class HierClusService {
  private urlPostInstance = 'http://127.0.0.1:5000/forest-hierarchical-clustering/';

  constructor(private httpClient: HttpClient) { }

  getHierarchicalClustering(thresholdCut: number): Observable<Array<any>> {
    return this.httpClient
    .get<Array<any>>(this.urlPostInstance + thresholdCut.toFixed(2).toString(), httpOptions)
      .pipe(
        retry(3),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(
      `Something went wrong while creating the forest hierarchical clustering.
       Please check your instance values are correct.`);
    }
}
